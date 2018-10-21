import { SessionResource } from "../../../shared/resources/session.resource";
import { Session } from "chipster-js-common";
import { Injectable } from "@angular/core";
import { DialogModalService } from "./dialogmodal/dialogmodal.service";
import * as _ from "lodash";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";

@Injectable()
export class SessionService {
  constructor(
    private sessionResource: SessionResource,
    private dialogModalService: DialogModalService,
    private restErrorService: RestErrorService
  ) {}

  updateSession(session: Session) {
    return this.sessionResource.updateSession(session);
  }

  openRenameModalAndUpdate(session: Session) {
    this.dialogModalService
      .openSessionNameModal("Rename session", session.name)
      .flatMap((name: string) => {
        session.name = name;
        return this.updateSession(session);
      })
      .subscribe(null, err =>
        this.restErrorService.handleError(err, "Rename session failed")
      );
  }

  openNotesModalAndUpdate(session: Session) {
    this.dialogModalService
      .openNotesModal(session)
      .flatMap((notes: string) => {
        session.notes = notes;
        return this.updateSession(session);
      })
      .subscribe(null, err =>
        this.restErrorService.handleError(err, "Failed to edit session notes")
      );
  }
}
