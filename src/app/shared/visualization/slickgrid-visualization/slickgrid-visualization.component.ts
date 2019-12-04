import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { AngularGridInstance, Column, GridOption } from 'angular-slickgrid';
import { Dataset } from 'chipster-js-common';
import * as d3 from "d3";
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';
import { RestErrorService } from '../../../core/errorhandler/rest-error.service';
import { LoadState, State } from '../../../model/loadstate';
import { SessionData } from '../../../model/session/session-data';
import TSVFile from '../../../model/tsv/TSVFile';
import { SessionDataService } from '../../../views/sessions/session/session-data.service';
import { FileResource } from '../../resources/fileresource';
import { Tags, TypeTagService } from '../../services/typetag.service';

@Component({
  selector: 'ch-slickgrid-visualization',
  templateUrl: './slickgrid-visualization.component.html',
  styleUrls: ['./slickgrid-visualization.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class SlickgridVisualizationComponent implements OnInit {

  state: LoadState;
  constructor(
    private fileResource: FileResource,
    private sessionDataService: SessionDataService,
    private typeTagService: TypeTagService,
    private restErrorService: RestErrorService
  ) {

  }
  @Input()
  dataset: Dataset;
  @Input()
  sessionData: SessionData;
  private maxBytes = 100 * 1024;
  private unsubscribe: Subject<any> = new Subject();
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  grid: any;
  angularGrid: AngularGridInstance;
  gridObj: any;
  dataViewObj: any;
  slickDataset: any;

  ngOnChanges() {

    // check for empty file
    if (this.dataset.size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }

    this.fileResource
      .getData(this.sessionDataService.getSessionId(), this.dataset, this.maxBytes)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (result: any) => {
          // parse all loaded data
          const parsedTSV = d3.tsvParseRows(result);



          // type-service gives the column titles for some file types
          const typeTitles = this.typeTagService.get(
            this.sessionData,
            this.dataset,
            Tags.COLUMN_TITLES
          );

          if (typeTitles) {
            // create a new first row from the column titles
            parsedTSV.unshift(typeTitles.split("\t"));
          }

          const normalizedTSV = new TSVFile(
            parsedTSV,
            this.dataset.datasetId,
            "file"
          );

          console.log(normalizedTSV.headers);

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

          this.slickDataset = parsedTSV;

          this.state = new LoadState(State.Ready);


        },
        (error: Response) => {
          this.state = new LoadState(State.Fail, "Loading data failed");
          this.restErrorService.showError(this.state.message, error);
        }
      );


  }

  ngOnInit() {
  }

}
