import {Injectable} from "@angular/core";
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import Dataset from "../../../../model/session/dataset";
import {SessionData} from "../../../../model/session/session-data";
import {SessionDataService} from "../sessiondata.service";
import {DatasetHistorymodalComponent} from "./datasethistorymodal/datasethistorymodal.component";

@Injectable()
export class DatasetModalService {

  constructor(private ngbModal: NgbModal,
              private sessionDataService: SessionDataService) {
  }

  renameDatasetDialog(dataset: Dataset) {
    var result = prompt('Change the name of the node', dataset.name);
    if (result) {
      dataset.name = result;
    }
    this.sessionDataService.updateDataset(dataset);
  }

  openDatasetHistoryModal(dataset: Dataset,sessionData:SessionData) {
    const modalRef = this.ngbModal.open(DatasetHistorymodalComponent, {size: "lg"});
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.sessionData= sessionData;
  }
}
