import { Injectable } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import { SessionData } from "../../../../model/session/session-data";
import { DatasetHistoryModalComponent } from "./dataset-history-modal/dataset-history-modal.component";

@Injectable()
export class DatasetModalService {
  constructor(private ngbModal: NgbModal) {}

  openDatasetHistoryModal(dataset: Dataset, sessionData: SessionData): void {
    const modalRef = this.ngbModal.open(DatasetHistoryModalComponent, {
      size: "lg"
    });
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.sessionData = sessionData;
  }
}
