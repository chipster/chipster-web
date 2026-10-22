import { Component, ChangeDetectionStrategy, inject, input, output } from "@angular/core";
import { Session, SessionState } from "chipster-js-common";
import log from "loglevel";
import { map, mergeMap } from "rxjs/operators";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../model/session/session-data";
import { SessionResource } from "../../../../shared/resources/session.resource";
import { RouteService } from "../../../../shared/services/route.service";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
import { SessionDataService } from "../session-data.service";
import { SessionEventService } from "../session-event.service";
import { SessionService } from "../session.service";
import { DatasetModalService } from "../selectiondetails/datasetmodal.service";
import { NGB_DROPDOWN_IMPORTS } from "../../../../shared/directives/dropdown-close.directive";
import { BytesPipe } from "../../../../shared/pipes/bytes.pipe";
import { LocalDatePipe } from "../../../../shared/pipes/local-date.pipe";

@Component({
  selector: "ch-session-details",
  templateUrl: "./session-details.component.html",
  styleUrls: ["./session-details.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NGB_DROPDOWN_IMPORTS, BytesPipe, LocalDatePipe],
})
export class SessionDetailsComponent {
  private sessionDataService = inject(SessionDataService);
  private sessionEventService = inject(SessionEventService);
  private sessionService = inject(SessionService);
  private restErrorService = inject(RestErrorService);
  private dialogModalService = inject(DialogModalService);
  private sessionResource = inject(SessionResource);
  private routeService = inject(RouteService);
  private datasetModalService = inject(DatasetModalService);

  readonly session = input<Session>(undefined);

  readonly sessionData = input<SessionData>(undefined); // needed for duplicate session

  readonly deleteSession = output<Session>();

  renameSessionModal() {
    this.sessionService.openRenameModalAndUpdate(this.session());
  }

  notesModal() {
    this.sessionService.openNotesModalAndUpdate(this.session());
  }

  sharingModal() {
    this.dialogModalService.openSharingModal(this.session(), this.sessionEventService.getRuleStream());
  }

  duplicateModal(): void {
    // TODO add note about jobs remaining in old if not temp session

    let newSessionId: string; // ugly

    this.dialogModalService
      .openSessionNameModal("Duplicate session", this.session().name + "_copy", "Duplicate")
      .pipe(
        mergeMap((name) => {
          let copyOrUpdate$;
          const sessionData = this.sessionData();
          if (!this.sessionService.isTemporary(sessionData.session)) {
            log.info("duplicate for normal session, copying session");
            copyOrUpdate$ = this.sessionResource.copySession(sessionData, name, false).pipe(
              map((sessionId) => {
                newSessionId = sessionId;
                return sessionId;
              }),
            );
          } else {
            log.info("duplicate for temp session, updating session");
            sessionData.session.name = name;
            sessionData.session.state = SessionState.Ready;
            copyOrUpdate$ = this.sessionService.updateSession(sessionData.session).pipe(map(() => true));
          }

          return this.dialogModalService.openSpinnerModal("Duplicate session", copyOrUpdate$);
        }),
      )
      .subscribe({
        next: () => {
          if (newSessionId != null) {
            this.routeService.navigateToSession(newSessionId);
          }
        },
        error: (err) => this.restErrorService.showError("Duplicate session failed", err),
      });
  }

  downloadSession() {
    this.sessionService.downloadSession(this.sessionDataService.getSessionId());
  }

  removeSessionModal() {
    this.dialogModalService
      .openBooleanModal(
        "Delete session",
        "Delete session " + this.sessionData().session.name + "?",
        "Delete",
        "Cancel",
        "btn-danger",
      )
      .then(
        () => {
          this.deleteSession.emit(this.session());
        },
        () => {
          // modal dismissed
        },
      );
  }

  mergeSessionModal() {
    this.datasetModalService.openMergeSessionToCurrentSessionModal(this.sessionData());
  }

  getSessionSize() {
    return this.sessionDataService.getSessionSize(this.sessionData());
  }
}
