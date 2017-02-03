import Dataset from "../../../../../model/session/dataset";
import IQService = angular.IQService;
import {Component, Input} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AddDatasetModalContent} from "./adddatasetmodal.content";

@Component({
  selector: 'ch-add-dataset-modal',
  templateUrl: './adddatasetmodal.component.html'
})
export class AddDatasetModalComponent {

  @Input() datasetsMap: Map<string, Dataset>;
  @Input() sessionId: string;
  @Input() oneFile: boolean;
  @Input() files: any[];

  constructor(private modalService: NgbModal) {
  }

  open() {
    const modalRef = this.modalService.open(AddDatasetModalContent, {size: "lg"});
    modalRef.componentInstance.datasetsMap = this.datasetsMap;
    modalRef.componentInstance.sessionId = this.sessionId;
    modalRef.componentInstance.oneFile = this.oneFile;
    modalRef.componentInstance.files = this.files;
  }
}
