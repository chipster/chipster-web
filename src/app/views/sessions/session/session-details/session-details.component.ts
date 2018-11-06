import { Component, Input } from "@angular/core";
import { Session } from "chipster-js-common";
import { SessionDataService } from "../session-data.service";
import { SessionService } from "../session.service";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
import { SessionResource } from "../../../../shared/resources/session.resource";
import { SessionData } from "../../../../model/session/session-data";

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

  constructor(
    private sessionDataService: SessionDataService,
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
    this.dialogModalService.openSharingModal(this.session);
  }

  duplicateModal() {
    this.dialogModalService
      .openSessionNameModal("Duplicate session", this.session.name + "_copy")
      .flatMap(name => {
        const copySessionObservable = this.sessionResource.copySession(
          this.sessionData,
          name
        );
        return this.dialogModalService.openSpinnerModal(
          "Duplicate session",
          copySessionObservable
        );
      })
      .subscribe(null, err =>
        this.restErrorService.handleError(err, "Duplicate session failed")
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
          // delete the session only from this user (i.e. the rule)
          this.sessionDataService
            .deletePersonalRules(this.sessionData.session)
            .subscribe(
              () => {},
              err => {
                this.restErrorService.handleError(
                  err,
                  "Failed to delete the session"
                );
              }
            );
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
