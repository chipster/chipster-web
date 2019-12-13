import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import Dataset from 'chipster-js-common/lib/model/dataset';
import { SessionData } from '../../../../../model/session/session-data';

@Component({
  selector: 'ch-import-tool',
  templateUrl: './import-tool.component.html',
  styleUrls: ['./import-tool.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ImportToolComponent implements OnInit {

  @Input() dataset: Dataset;
  @Input() sessionData: SessionData;
  constructor(public activeModal: NgbActiveModal) { }

  // it should contain the side bar and all the logic for import tool processing
  // should recv the output of click events from angular-slick grid
  ngOnInit() {
  }

}
