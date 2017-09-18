import {Injectable} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {StringModalComponent} from "./stringmodal/stringmodal.component";
import {BooleanModalComponent} from "./booleanmodal/booleanmodal.component";
import {NotesModalComponent} from "./notesmodal/notesmodal.component";
import {SharingModalComponent} from "./sharingmodal/sharingmodal.component";
import {SpinnerModalComponent} from "./spinnermodal/spinnermodal.component";

@Injectable()
export class DialogModalService {

  constructor(private modalService: NgbModal) {
  }

  openSessionNameModal(title, name) {
    return this.openStringModal(title, "Session name", name, "Save");
  }

  openStringModal(title, description, value, buttonText) {
    let modalRef = this.modalService.open(StringModalComponent);
    modalRef.componentInstance.value = value;
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.description = description;
    modalRef.componentInstance.buttonText = buttonText;

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
