import {
  AfterViewInit,
  Component,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  ViewChild
} from "@angular/core";
import { Response } from "@angular/http";
import { Dataset } from "chipster-js-common";
import * as d3 from "d3";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../../../model/loadstate";
import { SessionData } from "../../../../../model/session/session-data";
import { FileResource } from "../../../../../shared/resources/fileresource";
import { NativeElementService } from "../../../../../shared/services/native-element.service";
import { SpreadsheetService } from "../../../../../shared/services/spreadsheet.service";
import { TsvService } from "../../../../../shared/services/tsv.service";
import {
  Tags,
  TypeTagService
} from "../../../../../shared/services/typetag.service";
import { SessionDataService } from "../../session-data.service";
import { VisualizationModalService } from "../visualizationmodal.service";

@Component({
  selector: "ch-spreadsheet-visualization",
  templateUrl: "./spreadsheet-visualization.component.html",
  styleUrls: ["./spreadsheet-visualization.component.less"]
})
export class SpreadsheetVisualizationComponent
  implements OnChanges, OnDestroy, AfterViewInit {
  @Input()
  dataset: Dataset;
  @Input()
  modalMode: boolean;
  @Input()
  sessionData: SessionData;
  @Input()
  divWidth: any;

  @ViewChild("horizontalScroll") horizontalScrollDiv;

  // takes ~100 ms with ADSL
  private fileSizeLimit = 100 * 1024;
  private modalFileSizeLimit = 20 * 1024 * 1024;
  // nice round number for tables with reasonable number of columns
  private maxRowsimit = 100;
  // limit the number of rows even further if there are hundreds or thousands
  // of columns to keep the page somewhat responsive
  private maxCellsLimit = 10 * 1000;
  public lineCount: number;
  public fullFileVisible;
  public showingTruncated;
  public totalRowCount;
  readonly tableContainerId: string =
    "tableContainer-" +
    Math.random()
      .toString(36)
      .substr(2);

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
    private restErrorService: RestErrorService,
    private spreadsheetService: SpreadsheetService,
    private nativeElementService: NativeElementService,
    private tsvService: TsvService
  ) {}

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading data...");

    // remove old table
    this.destroyHot();

    // check for empty file
    if (this.dataset.size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }

    if (this.dataset.size > this.modalFileSizeLimit && this.modalMode) {
      this.showingTruncated = true;
    }
    // limiting the full screen downloaded stream size also as it freezes the view
    const modalfileSizeLimit =
      this.dataset.size < this.modalFileSizeLimit
        ? null
        : this.modalFileSizeLimit;
    const maxBytes = this.modalMode ? modalfileSizeLimit : this.fileSizeLimit;

    this.fileResource
      .getData(this.sessionDataService.getSessionId(), this.dataset, maxBytes)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (result: any) => {
          // parse all loaded data
          let parsedTSV = d3.tsvParseRows(result);
          this.totalRowCount = parsedTSV.length;

          // if its a modal, show the entire file otherwise limit the rows
          if (!this.modalMode) {
            // limit the number of rows to show
            if (parsedTSV.length > this.maxRowsimit + 1) {
              parsedTSV = parsedTSV.slice(0, this.maxRowsimit + 1);
            }

            // limit the number of cells to show
            const columns = parsedTSV[0].length;
            if (parsedTSV.length * columns > this.maxCellsLimit) {
              parsedTSV = parsedTSV.slice(0, this.maxCellsLimit / columns);
            }
          }

          // skip comment lines, e.g. lines starting with ## in a VCF file
          const skipLines = this.typeTagService.get(
            this.sessionData,
            this.dataset,
            Tags.SKIP_LINES
          );

          if (skipLines) {
            parsedTSV = parsedTSV.filter(row => !row[0].startsWith(skipLines));
          }

          // if not full file, remove the last, possibly incomplete line
          // could be the only line, will then show first 0 lines instead of a truncated first line
          if (result.length < this.dataset.size) {
            this.fullFileVisible = false;
            parsedTSV.pop();
          } else {
            if (this.totalRowCount > parsedTSV.length) {
              this.fullFileVisible = false;
            } else {
              this.fullFileVisible = true;
            }
          }
          // FIXME maybe make it more clear whether header is included in the line count or not
          // TSV2File has fields for figuring this out
          this.lineCount = parsedTSV.length;

          const tsv2File = this.tsvService.getTSV2FileFromArray(
            this.dataset,
            this.sessionData,
            parsedTSV
          );

          let headers = tsv2File.getHeadersForSpreadSheet();
          let body = tsv2File.getBody();

          // if there is only one line, show it as content, because Handsontable doesn't allow
          // headers to be shown alone
          if (body.length === 0) {
            body = [headers];
            headers = null;
          }

          const container = document.getElementById(this.tableContainerId);

          this.zone.runOutsideAngular(() => {
            // if the visualization isn't removed already
            if (container != null) {
              this.hot = new Handsontable(
                container,
                this.getSettings(headers, body, container)
              );
            }
          });
          this.state = new LoadState(State.Ready);
        },
        (error: Response) => {
          this.state = new LoadState(State.Fail, "Loading data failed");
          this.restErrorService.showError(this.state.message, error);
        }
      );
  }

  ngAfterViewInit() {
    // not created in modal
    if (this.horizontalScrollDiv) {
      this.nativeElementService.disableGestures(
        this.horizontalScrollDiv.nativeElement
      );
    }
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

  showAll() {
    this.visualizationModalService.openVisualizationModal(
      this.dataset,
      "spreadsheet",
      this.sessionData
    );
  }

  getSettings(headers: string[], content: string[][], container) {
    const tableHeight = this.modalMode
      ? container.style.height
      : content.length * 23 + 30; // extra for header-row and borders
    const tableWidth = this.modalMode
      ? null
      : this.spreadsheetService.guessWidth(headers, content);

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
      wordWrap: false
    };
  }
}
