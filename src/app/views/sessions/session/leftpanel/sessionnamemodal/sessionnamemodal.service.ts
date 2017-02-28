import {Injectable} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {SessionNameModalComponent} from "./sessionnamemodal.component";

@Injectable()
export default class SessionNameModalService {

  constructor(private modalService: NgbModal) {
  }

  openSessionNameModal(title, name) {
    let modalRef = this.modalService.open(SessionNameModalComponent);
    modalRef.componentInstance.name = name;
    modalRef.componentInstance.title = title;

    return modalRef.result;
  }
}
