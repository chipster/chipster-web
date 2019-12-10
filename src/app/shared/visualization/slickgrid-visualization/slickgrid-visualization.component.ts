import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AngularGridInstance, Column, GridOption } from 'angular-slickgrid';


@Component({
  selector: 'ch-slickgrid-visualization',
  templateUrl: './slickgrid-visualization.component.html',
  styleUrls: ['./slickgrid-visualization.component.scss']
})
export class SlickgridVisualizationComponent implements OnInit {

  constructor() { }

  @ViewChild('grid1', { static: false }) grid1: ElementRef;

  title = 'ngSlick';

  public columnDefinitions: Column[] = [];
  public gridOptions: GridOption = {};
  public dataset: any[] = [];
  grid: any;
  angularGrid: AngularGridInstance;
  gridObj: any;
  dataViewObj: any;


  ngOnInit(): void {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', sortable: true },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true },
      { id: '%', name: '% Completeng', field: 'percentComplete', sortable: true },
      { id: 'start', name: 'Start', field: 'start' },
      { id: 'finish', name: 'Finish', field: 'finish' },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true }
    ];

    this.gridOptions = {
      enableAutoResize: true,
      enableCellNavigation: true,
      enableColumnReorder: false,
      enableHeaderMenu: false,
      headerButton: {
        onCommand: (e, args) => {
          console.log(args.column);
        }
      }

    };

    this.dataset = [];

    // for demo purpose, let's mock a 100 lines of data
    for (let i = 0; i < 100; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 28));
      const randomPercent = Math.round(Math.random() * 100);

      this.dataset[i] = {
        id: i, // again VERY IMPORTANT to fill the "id" with unique values
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: `${randomMonth}/${randomDay}/${randomYear}`,
        finish: `${randomMonth}/${randomDay}/${randomYear}`,
        effortDriven: (i % 5 === 0)
      };
    }
  }
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;

    // the Angular Grid Instance exposes both Slick Grid & DataView objects
    this.gridObj = angularGrid.slickGrid;
    this.dataViewObj = angularGrid.dataView;

    // it also exposes all the Services
    // this.angularGrid.resizerService.resizeGrid(10);
  }

  onCellChanged(e, args) {
    console.log("cell changed");
  }

  onCellClicked(e, args) {
    // do something
    console.log("cell clicked");
  }

  onHeaderClicked(e, args) {
    console.log(" header clicked");
  }

}
