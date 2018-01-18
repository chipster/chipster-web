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

  openSessionNameModal(title, name): Observable<string> {
    return this.openStringModal(title, null, "Session name", name, "Save");
  }

  openStringModal(title, message, description, value, buttonText, cancelButtonText = 'Cancel', closeOnBackdropClick = true) {

    let ngbModalOptions: NgbModalOptions = {};

    if (!closeOnBackdropClick) {
      ngbModalOptions = {
        backdrop : 'static',
        keyboard : false
      };
    }

    let modalRef = this.modalService.open(StringModalComponent, ngbModalOptions);
    modalRef.componentInstance.value = value;
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.description = description;
    modalRef.componentInstance.buttonText = buttonText;
    modalRef.componentInstance.cancelButtonText = cancelButtonText;

    console.log('dialog promise', modalRef.result);

    return Observable.fromPromise(modalRef.result)
      .catch(err => {
        console.log('modal dismissed', err);
        return Observable.empty();
      });
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
