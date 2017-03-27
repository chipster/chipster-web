import {Injectable} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {StringModalComponent} from "./stringmodal.component";

@Injectable()
export class StringModalService {

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
}
