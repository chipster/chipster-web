import {SessionDataService} from "../../sessiondata.service";
import * as d3 from "d3";
import {Input, Component, NgZone, OnDestroy, OnChanges} from "@angular/core";
import TSVFile from "../../../../../model/tsv/TSVFile";
import {FileResource} from "../../../../../shared/resources/fileresource";
import {Response} from "@angular/http";
import Dataset from "../../../../../model/session/dataset";
import {VisualizationModalService} from "../visualizationmodal.service";
import {SessionData} from "../../../../../model/session/session-data";
import {Tags, TypeTagService} from "../../../../../shared/services/typetag.service";
import {RestErrorService} from "../../../../../core/errorhandler/rest-error.service";
import {LoadState, State} from "../../../../../model/loadstate";
import {Subject} from "rxjs/Subject";
import { SpreadsheetService } from "../../../../../shared/services/spreadsheet.service";

@Component({
  selector: 'ch-spreadsheet-visualization',
  templateUrl: "./spreadsheetvisualization.component.html",
  styleUrls: ['./spreadsheetvisualization.component.less']
})
export class SpreadsheetVisualizationComponent implements OnChanges, OnDestroy {

  @Input() dataset: Dataset;
  @Input() showFullData: boolean;
  @Input() sessionData: SessionData;

  private fileSizeLimit = 10 * 1024;
  private lineCount: number;
  readonly tableContainerId: string = "tableContainer-" + Math.random().toString(36).substr(2);

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  // MUST be handled outside Angular zone to prevent a change detection loop
  hot: ht.Methods;

  constructor(
    private fileResource: FileResource,
    private sessionDataService: SessionDataService,
    private visualizationModalService: VisualizationModalService,
    private typeTagService: TypeTagService,
    private zone: NgZone,
    private errorHandlerService: RestErrorService,
    private spreadsheetService: SpreadsheetService) {
  }

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading data...");

    // remove old table
    this.destroyHot();

    const maxBytes = this.showFullData ? null : this.fileSizeLimit;

    this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset, maxBytes)
      .takeUntil(this.unsubscribe)
      .subscribe((result: any) => {
        let parsedTSV = d3.tsvParseRows(result);

        // skip comment lines, e.g. lines starting with ## in a VCF file
        const skipLines = this.typeTagService.get(this.sessionData, this.dataset, Tags.SKIP_LINES);

        if (skipLines) {
          parsedTSV = parsedTSV.filter(row => !row[0].startsWith(skipLines));
        }

        // if not full file, remove the last, possibly incomplete line
        // could be the only line, will then show first 0 lines instead of a truncated first line
        if (!this.isCompleteFile() && result.length >= this.fileSizeLimit) {
          parsedTSV.pop();
        }
        this.lineCount = parsedTSV.length;

        // type-service gives the column titles for some file types
        const typeTitles = this.typeTagService.get(this.sessionData, this.dataset, Tags.COLUMN_TITLES);

        if (typeTitles) {
          // create a new first row from the column titles
          parsedTSV.unshift(typeTitles.split('\t'));
        }

        const normalizedTSV = new TSVFile(parsedTSV, this.dataset.datasetId, 'file');

        let headers = normalizedTSV.getRawData()[0];
        let content = normalizedTSV.getRawData().slice(1);

        // if there is only one line, show it as content, because Handsontable doesn't allow
        // headers to be shown alone
        if (content.length === 0) {
          content = [headers];
          headers = null;
        }

        const container = document.getElementById(this.tableContainerId);

        this.zone.runOutsideAngular(() => {
          // if the visualization isn't removed already
          if (container != null) {
            this.hot = new Handsontable(container, this.getSettings(headers, content, container));
          }
        });
        this.state = new LoadState(State.Ready);
      }, (error: Response) => {
        this.state = new LoadState(State.Fail, "Loading data failed");
        this.errorHandlerService.handleError(error, this.state.message);
      });
  }

  ngOnDestroy() {
    this.destroyHot();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  destroyHot() {
    if (this.hot) {
      this.zone.runOutsideAngular(() => {
        this.hot.destroy();
        // don't call destroy() twice even if the component is recycled and the loading of the second file fails
        this.hot = null;
      });
    }

  }

  isCompleteFile() {
    return this.showFullData;
  }

  showAll() {
    this.visualizationModalService.openVisualizationModal(this.dataset, 'spreadsheet', this.sessionData);
  }

  getSettings(headers: string[], content: string[][], container) {

    const tableHeight = this.showFullData ? container.style.height : content.length * 23 + 50; // extra for header-row and borders
    const tableWidth = this.showFullData ? null : this.spreadsheetService.guessWidth(headers, content);

    return {
      data: content,
      colHeaders: headers,
      columnSorting: true,
      manualColumnResize: true,
      sortIndicator: true,
      readOnly: true,
      rowHeights: 23,
      height: tableHeight,
      renderAllRows: false,
      scrollColHeaders: false,
      scrollCompatibilityMode: false,
      width: tableWidth,
    };
  }
}
