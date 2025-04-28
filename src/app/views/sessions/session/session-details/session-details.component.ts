import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Session, SessionState } from "chipster-js-common";
import log from "loglevel";
import { flatMap, map, mergeMap } from "rxjs/operators";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../model/session/session-data";
import { SessionResource } from "../../../../shared/resources/session.resource";
import { RouteService } from "../../../../shared/services/route.service";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
import { SessionDataService } from "../session-data.service";
import { SessionEventService } from "../session-event.service";
import { SessionService } from "../session.service";

@Component({
  selector: "ch-session-details",
  templateUrl: "./session-details.component.html",
  styleUrls: ["./session-details.component.less"],
})
export class SessionDetailsComponent {
  @Input()
  session: Session;

  @Input()
  sessionData: SessionData; // needed for duplicate session

  @Output() deleteSession: EventEmitter<Session> = new EventEmitter();

  constructor(
    private sessionDataService: SessionDataService,
    private sessionEventService: SessionEventService,
    private sessionService: SessionService,
    private restErrorService: RestErrorService,
    private dialogModalService: DialogModalService,
    private sessionResource: SessionResource,
    private routeService: RouteService,
  ) {}

  renameSessionModal() {
    this.sessionService.openRenameModalAndUpdate(this.session);
  }

  notesModal() {
    this.sessionService.openNotesModalAndUpdate(this.session);
  }

  sharingModal() {
    this.dialogModalService.openSharingModal(this.session, this.sessionEventService.getRuleStream());
  }

  duplicateModal(): void {
    // TODO add note about jobs remaining in old if not temp session

    let newSessionId: string; // ugly

    this.dialogModalService
      .openSessionNameModal("Duplicate session", this.session.name + "_copy", "Duplicate")
      .pipe(
        flatMap((name) => {
          let copyOrUpdate$;
          if (!this.sessionService.isTemporary(this.sessionData.session)) {
            log.info("duplicate for normal session, copying session");
            copyOrUpdate$ = this.sessionResource.copySession(this.sessionData, name, false).pipe(
              map((sessionId) => {
                newSessionId = sessionId;
                return sessionId;
              }),
            );
          } else {
            log.info("duplicate for temp session, updating session");
            this.sessionData.session.name = name;
            this.sessionData.session.state = SessionState.Ready;
            copyOrUpdate$ = this.sessionService.updateSession(this.sessionData.session).pipe(map(() => true));
          }

          return this.dialogModalService.openSpinnerModal("Duplicate session", copyOrUpdate$);
        }),
      )
      .subscribe(
        () => {
          if (newSessionId != null) {
            this.routeService.navigateToSession(newSessionId);
          }
        },
        (err) => this.restErrorService.showError("Duplicate session failed", err),
      );
  }

  downloadSession() {
    this.sessionService.downloadSession(this.sessionDataService.getSessionId());
  }

  removeSessionModal() {
    this.dialogModalService
      .openBooleanModal("Delete session", "Delete session " + this.sessionData.session.name + "?", "Delete", "Cancel")
      .then(
        () => {
          this.deleteSession.emit(this.session);
        },
        () => {
          // modal dismissed
        },
      );
  }

  mergeSessionModal() {
    this.sessionResource
      .getSessions()
      .pipe(
        mergeMap((sessions) => {
          const sessionIdToNameMap = new Map(sessions.map((s) => [s.sessionId, s.name]));

          return this.dialogModalService.openOptionModal(
            "Merge session",
            "Select session to merge. The selected session will be merged to the right side of the current session.",
            sessionIdToNameMap,
            "Merge",
            "Choose",
          );
        }),
        mergeMap((sourceSessionId) => this.sessionResource.loadSession(sourceSessionId, true)),
        mergeMap((sourceSessionData) => {
          // find out the width of the current session workflow
          const maxSourceX = Math.max(...Array.from(this.sessionData.datasetsMap.values()).map((d) => d.x));
          // add the width of the dataset blob and little margin
          const xOffset = maxSourceX + 100;

          console.log("width of the current session is " + maxSourceX + ", move merged session by " + xOffset);

          // move other session sideways
          // we can modify sourceSessionData directly, because its our own copy which we just got from the server
          Array.from(sourceSessionData.datasetsMap.values()).forEach((dataset) => {
            // xOffset is -Infinity if the current session is empty
            if (xOffset != null && xOffset > 0 && dataset.x != null) {
              dataset.x = dataset.x + xOffset;
            }
          });

          // generate new Dataset and Job IDs so that we can merge the same datasets several times
          this.sessionResource.changeIds(sourceSessionData);

          return this.sessionResource.copyToExistingSession(this.sessionData.session.sessionId, sourceSessionData);
        }),
      )
      .subscribe({
        next: (x) => console.log("completed session merge", x),
        error: (err) => this.restErrorService.showError("failed to merge session", err),
      });
  }

  getSessionSize() {
    return this.sessionDataService.getSessionSize(this.sessionData);
  }
}
