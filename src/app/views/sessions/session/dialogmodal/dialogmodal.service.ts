import {Injectable} from "@angular/core";
import {NgbModal, NgbModalOptions} from "@ng-bootstrap/ng-bootstrap";
import {StringModalComponent} from "./stringmodal/stringmodal.component";
import {BooleanModalComponent} from "./booleanmodal/booleanmodal.component";
import {NotesModalComponent} from "./notesmodal/notesmodal.component";
import {SharingModalComponent} from "./sharingmodal/sharingmodal.component";
import {SpinnerModalComponent} from "./spinnermodal/spinnermodal.component";
import {Observable} from "rxjs/Observable";

@Injectable()
export class DialogModalService {

  constructor(private modalService: NgbModal) {
  }

  openSessionNameModal(title, name, buttonText = 'Save'): Observable<string> {
    return this.openStringModal(title, null, "Session name", name, buttonText);
  }

  openStringModal(title, description, value, buttonText) {
    let modalRef = this.modalService.open(StringModalComponent);
    modalRef.componentInstance.value = value;
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.description = description;
    modalRef.componentInstance.buttonText = buttonText;
    modalRef.componentInstance.cancelButtonText = cancelButtonText;
    modalRef.componentInstance.placeHolder = '';

    return modalRef.result;
  }

  openBooleanModal(title, message, okButtonText, cancelButtonText) {
    let modalRef = this.modalService.open(BooleanModalComponent);
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.okButtonText = okButtonText;
    modalRef.componentInstance.cancelButtonText = cancelButtonText;

    return modalRef.result;
  }

  openNotesModal(session) {
    let modalRef = this.modalService.open(NotesModalComponent);
    modalRef.componentInstance.session = session;
    return modalRef.result;
  }

  openSharingModal(session) {
    let modalRef = this.modalService.open(SharingModalComponent, {size: 'lg'});
    modalRef.componentInstance.session = session;
    return modalRef.result;
  }

  openSpinnerModal(message, observable) {
    let modalRef = this.modalService.open(SpinnerModalComponent);
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.observable = observable;
    return modalRef.result;
  }
}
