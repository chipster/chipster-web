import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Session, SessionState } from "chipster-js-common";
import log from "loglevel";
import { flatMap, map } from "rxjs/operators";
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
    private routeService: RouteService
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
      .openSessionNameModal("Copy session", this.session.name + "_copy", "Copy")
      .pipe(
        flatMap((name) => {
          let copyOrUpdate$;
          if (!this.sessionService.isTemporary(this.sessionData.session)) {
            log.info("save a copy for normal session, copying session");
            copyOrUpdate$ = this.sessionResource.copySession(this.sessionData, name, false).pipe(
              map((sessionId) => {
                newSessionId = sessionId;
                return sessionId;
              })
            );
          } else {
            log.info("save a copy for temp session, updating session");
            this.sessionData.session.name = name;
            this.sessionData.session.state = SessionState.Ready;
            copyOrUpdate$ = this.sessionService.updateSession(this.sessionData.session).pipe(map(() => true));
          }

          return this.dialogModalService.openSpinnerModal("Copy session", copyOrUpdate$);
        })
      )
      .subscribe(
        () => {
          if (newSessionId != null) {
            this.routeService.navigateToSession(newSessionId);
          }
        },
        (err) => this.restErrorService.showError("Copy session failed", err)
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
        }
      );
  }

  getSessionSize() {
    return this.sessionDataService.getSessionSize(this.sessionData);
  }
}
