import { Component, Input } from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Dataset from "../../../../../model/session/dataset";


@Component({
  selector: 'ch-datasethistorymodal',
  templateUrl: './datasethistorymodal.component.html',
  styleUrls: ['./datasethistorymodal.component.less']
})
export class DatasetHistorymodalComponent {

  @Input('dataset') dataset: Dataset;

  constructor(public activeModal: NgbActiveModal) { }
}
