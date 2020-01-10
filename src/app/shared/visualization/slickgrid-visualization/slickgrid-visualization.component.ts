import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AngularGridInstance, Column, GridOption } from 'angular-slickgrid';
import * as _ from "lodash";

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ch-slickgrid-visualization',
  templateUrl: './slickgrid-visualization.component.html',
  styleUrls: ['./slickgrid-visualization.component.scss']
})
export class SlickgridVisualizationComponent implements OnInit {
  @Input() headers: string[];
  @Input() content: string[][];


  constructor() { }

  @ViewChild('grid1', { static: false }) grid1: ElementRef;

  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  slickDataset: any[] = [];
  grid: any;
  angularGrid: AngularGridInstance;
  gridObj: any;
  dataViewObj: any;
  identifierSelectionMap: Map<string, boolean>;
  sampleSelectionMap: Map<string, boolean>;
  selectIdentifier = false;
  selectSample = false;


  ngOnInit(): void {

    this.columnDefinitions = [
    ];

    this.gridOptions = {
      enableAutoResize: true,
      enableCellNavigation: true,
      enableCheckboxSelector: false,
      enableHeaderMenu: false,
      headerButton: {
        onCommand: (e, args) => {
          console.log(args.column);
        }
      }

    };
    // Creating column defintions from heaf
    for (let i = 0; i < this.headers.length; i++) {
      this.columnDefinitions[i] = {
        id: this.headers[i], name: this.headers[i], field: this.headers[i], minWidth: 100, width: 200,
      };
    }

    for (let i = 0; i < 10; i++) {
      const dataRow = {};
      dataRow['id'] = i;
      for (let j = 0; j < this.content[i].length; j++) {
        dataRow[this.columnDefinitions[j].id] = this.content[i][j];
      }
      this.slickDataset.push(dataRow);
    }


  }

  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;
    // the Angular Grid Instance exposes both Slick Grid & DataView objects
    this.gridObj = angularGrid.slickGrid;
    this.dataViewObj = angularGrid.dataView;

    // it also exposes all the Services
    this.angularGrid.resizerService.resizeGrid(10);
  }

  onCellChanged(e, args): void {
    console.log(e, args);
  }

  onCellClicked(e, args): void {
    // do something
    console.log(e, args);
  }

  // Select the column for which header is clicked
  onHeaderClicked(e, args): void {
    // selectedValues are the values of the column that is selected
    const selectedValues = _.map(this.slickDataset, args.column.id);

    this.identifierSelectionMap = new Map();
    const colIndex = this.gridObj.getColumnIndex(args.column.id);

    // depending on the boolean value of the header map change the color of selection
    for (let row = 0; row < this.content.length; row++) {
      const selectedCell = this.gridObj.getCellNode(row, colIndex);
      selectedCell.style.background = '#bbdefb';
    }

    // now update the identifier and sample map based on which was getting selected
  }

  onSelectedRowsChanged(e, args): void {
    if (Array.isArray(args.rows)) {
      // user clicked on the 1st column, multiple checkbox selection
      console.log('multiple row checkbox selected', e, args);
    }
  }

  selectIdentifierColumn(): void {
    // when selecting identifier, make sample selection disable
    this.selectIdentifier = !this.selectIdentifier;
    this.selectSample = !this.selectSample;
    console.log("now selecting identifier" + this.selectIdentifier);
  }

  selectSampleColumn(): void {
    this.selectSample = !this.selectSample;
    this.selectIdentifier = !this.selectIdentifier;
    console.log("now selecting the sample column" + this.selectSample);

  }

}
