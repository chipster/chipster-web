import SessionDataService from "../../sessiondata.service";
import * as d3 from "d3";
import {Input, Component, ChangeDetectorRef} from "@angular/core";
import TSVFile from "../../../../../model/tsv/TSVFile";
import FileResource from "../../../../../shared/resources/fileresource";
import {Response} from "@angular/http";
import Dataset from "../../../../../model/session/dataset";
import VisualizationModalService from "../visualizationmodal.service";


@Component({
  selector: 'ch-spreadsheet-visualization',
  template: `
    <p *ngIf="!dataReady">Loading data...</p>

    <div *ngIf="dataReady">
      <label *ngIf="!isCompleteFile()">Showing first {{lineCount}} rows</label> 
      <label *ngIf="isCompleteFile()">Showing all {{lineCount}} rows</label>
      <a *ngIf="!isCompleteFile()" (click)="showAll()" class="pull-right">Show all</a>
    </div>

    <!-- tableContainer needs to be around or new Handsontable fails, so no ngIf for it -->
    <div id="tableContainer"></div>
    `
})
export class SpreadsheetVisualizationComponent {

  @Input() dataset: Dataset;
  @Input() showFullData: boolean = false;

  private fileSizeLimit = 10 * 1024;
  private lineCount: number;
  private dataReady: boolean = false;

  constructor(private fileResource: FileResource,
              private sessionDataService: SessionDataService,
              private visualizationModalService: VisualizationModalService) {
  }

  ngOnInit() {
    let maxBytes = this.showFullData ? -1 : this.fileSizeLimit;

    this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset.datasetId, maxBytes).subscribe((result: any) => {
      let parsedTSV = d3.tsvParseRows(result);

      // if not full file, remove the last, possibly incomplete line
      // could be the only line, will then show first 0 lines instead of a truncated first line
      if (!this.isCompleteFile()) {
        parsedTSV.pop();
      }
      this.lineCount = parsedTSV.length;

      let normalizedTSV = new TSVFile(parsedTSV, this.dataset.datasetId, 'file');
      const container = document.getElementById('tableContainer');
      new Handsontable(container, SpreadsheetVisualizationComponent.getSettings(normalizedTSV.getRawData()));
      this.dataReady = true;
    }, (e: Response) => {
      console.error('Fetching TSVData failed', e);
    })

  }

  isCompleteFile() {
    return this.showFullData;
  }

  showAll() {
    this.visualizationModalService.openVisualizationModal(this.dataset, 'spreadsheet');
  }

  static getSettings(array: string[][]) {
    const arrayHeight = array.length * 23 + 23; // extra for header-row
    return {
      data: array.slice(1),
      colHeaders: array[0],
      columnSorting: true,
      manualColumnResize: true,
      sortIndicator: true,
      readOnly: true,
      rowHeights: 23,
      height: arrayHeight,
      renderAllRows: false
    }
  }
}
