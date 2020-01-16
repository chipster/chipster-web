import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AngularGridInstance, Column, GridOption } from 'angular-slickgrid';
import * as d3 from "d3";
import * as _ from "lodash";
import { SessionDataService } from '../../../views/sessions/session/session-data.service';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ch-slickgrid-visualization',
  templateUrl: './slickgrid-visualization.component.html',
  styleUrls: ['./slickgrid-visualization.component.scss']
})
export class SlickgridVisualizationComponent implements OnInit {
  @Input() headers: string[];
  @Input() content: string[][];
  @Input() datasetId: string;


  constructor(private sessionDataService: SessionDataService) { }

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

    this.sampleSelectionMap = new Map();
    this.identifierSelectionMap = new Map();
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
    // Creating column defintions from header
    for (let i = 0; i < this.headers.length; i++) {
      this.columnDefinitions[i] = {
        id: this.headers[i], name: this.headers[i], field: this.headers[i], minWidth: 100, width: 200,
      };
    }

    console.log(this.content.length);

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
    const colIndex = this.gridObj.getColumnIndex(args.column.id);
    if (this.selectIdentifier) {
      this.sampleSelectionMap.forEach((value, key) => {
        console.log(key, value);
      });
      this.identifierSelectionMap.set(colIndex, true);
    }

    if (this.selectSample) {

      this.sampleSelectionMap.set(colIndex, true);
    }

    // depending on the boolean value of the header map change the color of selection
    for (let row = 0; row < 10; row++) {
      const selectedCell = this.gridObj.getCellNode(row, colIndex);
      if (this.selectIdentifier) {
        selectedCell.style.background = '#bbdefb';
      } else {
        console.log("doing else");
        selectedCell.style.background = '#bbbefc';
      }

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
    this.selectSample = false;
  }

  selectSampleColumn(): void {
    this.selectSample = !this.selectSample;
    this.selectIdentifier = false;

  }

  createNewDatasetFile(): void {
    // depending on sample map, we create that many tsv files
    // get the column indexes which have true in map
    // get the column name from identifier map
    // get the column name from sample map
    // create a tsv file with this columns

    // inititializing 2d array
    const dataTable = [];
    for (const id of this.identifierSelectionMap.keys()) {
      const selectedValues = _.map(this.slickDataset, this.columnDefinitions[id].id);
      for (let i = 0; i < selectedValues.length; i++) {
        dataTable[i] = [];
        for (let n = 0; n < this.identifierSelectionMap.size; n++) {
          dataTable[i][n] = "";
        }
      }
    }
    let j = 0;
    for (const id of this.identifierSelectionMap.keys()) {
      const selectedValues = _.map(this.slickDataset, this.columnDefinitions[id].id);
      console.log(selectedValues);
      for (let i = 0; i < selectedValues.length; i++) {
        dataTable[i][j] = selectedValues[i];
        console.log(j);
      }
      j++;
    }
    console.log(dataTable);

    const data = d3.tsvFormatRows(dataTable);
    console.log(data);
    /*this.sessionDataService
      .createDerivedDataset(
        "dataset.tsv",
        [this.datasetId],
        "Import Tool",
        data
      )
      .subscribe(null);*/
  }




  resetSelection(): void {
    // reset all selected columns
  }

}
