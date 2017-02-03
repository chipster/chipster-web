import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import Dataset from "../../../../../../model/session/dataset";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'ch-add-column-modal',
  templateUrl: './add-column-modal.component.html',
  styleUrls: ['./add-column-modal.component.less']
})
export class AddColumnModalComponent implements OnInit {

  @Input() handsOnTable: ht.Methods;
  @Input() colName: string;
  @Input() private datasets: Array<Dataset>;
  @ViewChild('addColumnModalRef') addColumnModalRef: ElementRef;
  modalRef: NgbModalRef;

  constructor(private modalService: NgbModal) {}

  open() {
    this.modalRef = this.modalService.open(this.addColumnModalRef);
  }

  addColumn() {
    var colHeaders = <Array<string>>(<ht.Options>this.handsOnTable.getSettings()).colHeaders;
    this.handsOnTable.alter('insert_col', colHeaders.length);
    // remove undefined column header
    colHeaders.pop();
    colHeaders.push(this.colName);
    this.handsOnTable.updateSettings({
      colHeaders: colHeaders
    }, false);
    this.colName = '';


    this.modalRef.close();
  }




}
