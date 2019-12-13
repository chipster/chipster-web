import { Injectable } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import { SessionData } from "../../../../model/session/session-data";
import { ImportToolComponent } from '../session-panel/import-tool/import-tool.component';
import { DatasetHistorymodalComponent } from "./datasethistorymodal/datasethistorymodal.component";

@Injectable()
export class DatasetModalService {
  constructor(private ngbModal: NgbModal) { }

  openDatasetHistoryModal(dataset: Dataset, sessionData: SessionData) {
    const modalRef = this.ngbModal.open(DatasetHistorymodalComponent, {
      size: "lg"
    });
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.sessionData = sessionData;
  }

  openImportToolModal(dataset: Dataset, sessionData: SessionData): void {
    const modalRef = this.ngbModal.open(ImportToolComponent, {
      size: "lg",
      windowClass: "modal-xl"
    });
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.sessionData = sessionData;
  }
}
