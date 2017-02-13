import {Injectable} from "@angular/core";
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {VisualizationModalComponent} from "./visualizationmodal.component";
import Dataset from "../../../../model/session/dataset";

@Injectable()
export default class VisualizationModalService {

  constructor(private ngbModal: NgbModal) {
  }

  openVisualizationModal(dataset: Dataset, visualizationId: string) {
    const modalRef = this.ngbModal.open(VisualizationModalComponent, {size: "lg"});
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.visualizationId = visualizationId;
  }
}
