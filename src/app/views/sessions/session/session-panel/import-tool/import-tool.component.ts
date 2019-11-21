import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Dataset } from 'chipster-js-common';
import { SessionData } from '../../../../../model/session/session-data';


@Component({
  selector: 'ch-import-tool',
  templateUrl: './import-tool.component.html',
  styleUrls: ['./import-tool.component.less'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ImportToolComponent implements OnInit {

  @Input()
  dataset: Dataset;
  @Input()
  sessionData: SessionData;
  constructor() { }

  dropdownList = [];
  selectedItems = [];
  dropdownSettings = {};

  ngOnInit() {
    // need to get this from header row of the tsv file
    this.dropdownList = [
      {"id" : 1, "itemName": "identifier"},
      {"id": 2, "itemName": "sample"}
    ];

    this.selectedItems = [];
    this.dropdownSettings = {
      singleSelection: false,
      text: "Chip counts",
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      enableSearchFilter: true,
      classes: "myclass custom-class"
    };
  }

  onItemSelect(item: any) {
    console.log(item);
    console.log(this.selectedItems);
  }
  OnItemDeSelect(item: any) {
    console.log(item);
    console.log(this.selectedItems);
  }
  onSelectAll(items: any) {
    console.log(items);
  }
  onDeSelectAll(items: any) {
    console.log(items);
  }

}
