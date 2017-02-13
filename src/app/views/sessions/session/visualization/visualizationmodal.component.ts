import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Dataset from "../../../../model/session/dataset";

@Component({
  selector: 'ch-visualizationmodal',
  templateUrl: './visualizationmodal.component.html'
})
export class VisualizationModalComponent {

  @Input('dataset') dataset: Dataset;
  @Input('visualizationId') visualizationId: string;

  constructor(public activeModal: NgbActiveModal) {}

}
