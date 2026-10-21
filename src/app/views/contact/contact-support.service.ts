import { Injectable, inject } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ContactSupportModalComponent } from "./contact-support-modal/contact-support-modal.component";

@Injectable({ providedIn: "root" })
export class ContactSupportService {
  private modalService = inject(NgbModal);

  openContactSupportModal(log = null) {
    const modalRef = this.modalService.open(ContactSupportModalComponent, {
      size: "lg",
      backdrop: "static", // don't close on backdrop click
    });
    modalRef.componentInstance.log = log;
  }
}
