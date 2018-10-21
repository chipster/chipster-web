import { Injectable } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { StringModalComponent } from "./stringmodal/stringmodal.component";
import { BooleanModalComponent } from "./booleanmodal/booleanmodal.component";
import { NotesModalComponent } from "./notesmodal/notesmodal.component";
import { SharingModalComponent } from "./sharingmodal/sharingmodal.component";
import { SpinnerModalComponent } from "./spinnermodal/spinnermodal.component";
import { Observable } from "rxjs/Observable";
import { TempCopyModalComponent } from "./temp-copy-modal/temp-copy-modal.component";

@Injectable()
export class DialogModalService {
  constructor(private modalService: NgbModal) {}

  openSessionNameModal(title, name, buttonText = "Save"): Observable<string> {
    return this.openStringModal(title, "Session name", name, buttonText);
  }

  openStringModal(title, description, value, buttonText) {
    const modalRef = this.modalService.open(StringModalComponent);
    modalRef.componentInstance.value = value;
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.description = description;
    modalRef.componentInstance.buttonText = buttonText;
    modalRef.componentInstance.placeHolder = "";

    return Observable.fromPromise(modalRef.result).catch(err => {
      if (err === undefined) {
        // dialog dismissed
        return Observable.empty();
      } else {
        // real error
        throw err;
      }
    });
  }

  openTempCopyModal(title, message, value, button1Text, button2Text) {
    const modalRef = this.modalService.open(TempCopyModalComponent);
    modalRef.componentInstance.value = value;
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.description = "Session name";
    modalRef.componentInstance.button1Text = button1Text;
    modalRef.componentInstance.button2Text = button2Text;
    modalRef.componentInstance.placeHolder = "";

    return Observable.fromPromise(modalRef.result);
  }

  openBooleanModal(title, message, okButtonText, cancelButtonText) {
    const modalRef = this.modalService.open(BooleanModalComponent);
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.okButtonText = okButtonText;
    modalRef.componentInstance.cancelButtonText = cancelButtonText;

    return modalRef.result;
  }

  openNotesModal(session): Observable<string> {
    const modalRef = this.modalService.open(NotesModalComponent);
    modalRef.componentInstance.session = session;
    return Observable.fromPromise(modalRef.result).catch(err => {
      if (err === undefined) {
        // dialog dismissed
        return Observable.empty();
      } else {
        // real error
        throw err;
      }
    });
  }

  openSharingModal(session) {
    const modalRef = this.modalService.open(SharingModalComponent, {
      size: "lg"
    });
    modalRef.componentInstance.session = session;
    return modalRef.result;
  }

  openSpinnerModal(message, observable) {
    const modalRef = this.modalService.open(SpinnerModalComponent);
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.observable = observable;
    return modalRef.result;
  }
}
