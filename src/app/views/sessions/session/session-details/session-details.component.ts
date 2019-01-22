import { Component, Input, EventEmitter, Output } from "@angular/core";
import { Session } from "chipster-js-common";
import { SessionDataService } from "../session-data.service";
import { SessionService } from "../session.service";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
import { SessionResource } from "../../../../shared/resources/session.resource";
import { SessionData } from "../../../../model/session/session-data";
import { SessionEventService } from "../session-event.service";

@Component({
  selector: "ch-session-details",
  templateUrl: "./session-details.component.html",
  styleUrls: ["./session-details.component.less"]
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
    private sessionResource: SessionResource
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

  duplicateModal() {
    this.dialogModalService
      .openSessionNameModal("Duplicate session", this.session.name + "_copy")
      .flatMap(name => {
        const copySessionObservable = this.sessionResource.copySession(
          this.sessionData,
          name,
          false
        );
        return this.dialogModalService.openSpinnerModal(
          "Duplicate session",
          copySessionObservable
        );
      })
      .subscribe(null, err =>
        this.restErrorService.showError("Duplicate session failed", err)
      );
  }

  downloadSession() {
    this.sessionService.downloadSession(this.sessionDataService.getSessionId());
  }

  removeSessionModal() {
    this.dialogModalService
      .openBooleanModal(
        "Delete session",
        "Delete session " + this.sessionData.session.name + "?",
        "Delete",
        "Cancel"
      )
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
