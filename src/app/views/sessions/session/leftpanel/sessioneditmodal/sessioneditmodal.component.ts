import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {Component, Input, ElementRef, ViewChild} from "@angular/core";
import {SessionData} from "../../../../../model/session/session-data";
import SessionDataService from "../../sessiondata.service";

@Component({
  selector: 'ch-session-edit-modal',
  templateUrl: './sessioneditmodal.html'
})
export class SessionEditModalComponent {

  @Input() sessionData: SessionData;
  @ViewChild('sessionEditModalTemplate') sessionEditModalTemplate: ElementRef;
  modalRef: NgbModalRef;

  constructor(private modalService: NgbModal,
              private sessionDataService: SessionDataService) {}

  openSessionEditModal() {
    this.modalRef = this.modalService.open(this.sessionEditModalTemplate);
  }

  save() {
    this.sessionDataService.updateSession(this.sessionData.session).subscribe( () => {
      this.modalRef.close();
    });
  };

}
