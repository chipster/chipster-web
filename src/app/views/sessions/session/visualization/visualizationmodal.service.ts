import { Injectable } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import type { VisualizationModalComponent } from "./visualizationmodal.component";

@Injectable({ providedIn: "root" })
export class VisualizationModalService {
  // loaded with import(), as the modals of DialogModalService: the visualization components of the modal's
  // template inject this service to open it. The chunk loads when this service is created
  private modal = import("./visualizationmodal.component");

  constructor(private ngbModal: NgbModal) {}

  openVisualizationModal(dataset: Dataset, visualizationId: string, sessionData?): Promise<NgbModalRef> {
    return this.modal.then((m) => {
      const modalRef = this.ngbModal.open(m.VisualizationModalComponent, { size: "xl" });
      const modal = modalRef.componentInstance as VisualizationModalComponent;
      modal.dataset = dataset;
      modal.visualizationId = visualizationId;
      modal.sessionData = sessionData;
      return modalRef;
    });
  }
}
