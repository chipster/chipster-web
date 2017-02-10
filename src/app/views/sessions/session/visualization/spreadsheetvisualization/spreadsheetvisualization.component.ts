import SessionDataService from "../../sessiondata.service";
import * as d3 from "d3";
import {Input, Component, ChangeDetectorRef} from "@angular/core";
import TSVFile from "../../../../../model/tsv/TSVFile";
import FileResource from "../../../../../shared/resources/fileresource";
import {Response} from "@angular/http";
import Dataset from "../../../../../model/session/dataset";


@Component({
  selector: 'ch-spreadsheet-visualization',
  template: `
    <label *ngIf="!isCompleteFile()">Showing the first {{lineCount}} lines</label> 
    <label *ngIf="isCompleteFile()">Showing all {{lineCount}} lines</label>
    <!--<a (click)="showMore()">Show more</a>-->
    <div id="tableContainer"></div>`

})
export class SpreadsheetVisualizationComponent {

  @Input() datasetId: string;
  @Input() selectedDatasets: Array<Dataset>;

  private fileSizeLimit = 10 * 1024;
  private lineCount: number;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private fileResource: FileResource,
    private sessionDataService: SessionDataService) {
  }

  ngOnInit() {
    this.fileResource.getLimitedData(this.sessionDataService.getSessionId(), this.datasetId, this.fileSizeLimit).subscribe( (result: any) => {
      let parsedTSV = d3.tsvParseRows(result);

      // if not full file, remove the last, possibly incomplete line
      // could be the only line, will then show first 0 lines instead of a truncated first line
      if (!this.isCompleteFile()) {
        parsedTSV.pop();
      }
      this.lineCount = parsedTSV.length;
      this.changeDetectorRef.detectChanges();

      let normalizedTSV = new TSVFile(parsedTSV, this.datasetId, 'file');
      const container = document.getElementById('tableContainer');
      new Handsontable(container, SpreadsheetVisualizationComponent.getSettings(normalizedTSV.getRawData()));
    }, (e: Response) => {
      console.error('Fetching TSVData failed', e);
    })

  }

  isCompleteFile() {
    return this.fileSizeLimit >= this.selectedDatasets[0].size;
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
