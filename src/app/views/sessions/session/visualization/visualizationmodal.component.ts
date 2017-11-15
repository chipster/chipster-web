import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Dataset from "../../../../model/session/dataset";
import {SessionData} from "../../../../model/session/session-data";

@Component({
  selector: 'ch-visualizationmodal',
  templateUrl: './visualizationmodal.component.html',
  styleUrls: ['./visualizationmodal.component.less']
})
export class VisualizationModalComponent {

  @Input('dataset') dataset: Dataset;
  @Input('sessionData') sessionData: SessionData;
  @Input('visualizationId') visualizationId: string;

  constructor(public activeModal: NgbActiveModal) {}

}
