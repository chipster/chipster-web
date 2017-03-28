import {Injectable} from "@angular/core";
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import Dataset from "../../../../model/session/dataset";
import {SessionDataService} from "../sessiondata.service";
import {DatasetHistorymodalComponent} from "./datasethistorymodal/datasethistorymodal.component";

@Injectable()
export class DatasetModalService {

  constructor(private ngbModal: NgbModal,
              private sessionDataService: SessionDataService) {
  }

  openDatasetHistoryModal(dataset: Dataset) {
    const modalRef = this.ngbModal.open(DatasetHistorymodalComponent, {size: "lg"});
    modalRef.componentInstance.dataset = dataset;
  }
}
