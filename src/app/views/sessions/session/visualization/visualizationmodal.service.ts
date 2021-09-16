import { Injectable } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import { VisualizationModalComponent } from "./visualizationmodal.component";

@Injectable()
export class VisualizationModalService {
  constructor(private ngbModal: NgbModal) {}

  openVisualizationModal(dataset: Dataset, visualizationId: string, sessionData?) {
    const modalRef = this.ngbModal.open(VisualizationModalComponent, {
      size: "xl",
    });
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.visualizationId = visualizationId;
    modalRef.componentInstance.sessionData = sessionData;
  }
}
