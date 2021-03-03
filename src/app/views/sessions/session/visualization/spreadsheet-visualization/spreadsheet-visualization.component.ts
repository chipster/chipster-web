import {
  AfterViewInit,
  Component,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  ViewChild
} from "@angular/core";
import { Dataset } from "chipster-js-common";
import * as d3 from "d3";
import log from "loglevel";
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

  @ViewChild("horizontalScroll", { static: false }) horizontalScrollDiv;

  // takes ~100 ms with ADSL
  private readonly fileSizeLimit = 1 * 1024 * 1024;
  private readonly modalFileSizeLimit = 10 * 1024 * 1024;
  // nice round number for tables with reasonable number of columns
  private readonly maxRowsLimit = 100;
  public gotFullFile: boolean;
  public limitRows: boolean;
  public getTruncatedFile: boolean;
  public modalWillHaveFullFile: boolean;
  public goToFullScreenText: string;
  private parsedTsvTotalRowCount: number;
  public rowCount: number;
  public rowCountBeforeLimit: number;
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

    // needed also in the preview text
    this.modalWillHaveFullFile = this.dataset.size <= this.modalFileSizeLimit;

    // modal mode could be undefined, we want explicit true or false
    this.getTruncatedFile =
      (!this.modalMode && this.dataset.size > this.fileSizeLimit) ||
      (this.modalMode && this.dataset.size > this.modalFileSizeLimit)
        ? true
        : false;

    // limit the full screen downloaded stream size also as it freezes the view
    const maxLimit = this.modalMode
      ? this.modalFileSizeLimit
      : this.fileSizeLimit;
    const maxBytes = this.getTruncatedFile ? maxLimit : null;

    this.fileResource
      .getData(this.sessionDataService.getSessionId(), this.dataset, maxBytes)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (result: any) => {
          this.gotFullFile = result.length === this.dataset.size;

          if (!this.getTruncatedFile && !this.gotFullFile) {
            log.warn(
              `should have gotten full file, but result size is ${result.length} while dataset size is ${this.dataset.size}`
            );
          }

          // parse all loaded data
          let parsedTSV = d3.tsvParseRows(result);
          this.parsedTsvTotalRowCount = parsedTSV.length;

          // if not full file, remove the last, possibly incomplete line
          // could be the only line, will then show first 0 lines instead of a truncated first line

          if (!this.gotFullFile) {
            parsedTSV.pop();
          }

          // filter out comment lines, e.g. lines starting with ## in a VCF file
          const skipLinesPrefix = this.typeTagService.get(
            this.sessionData,
            this.dataset,
            Tags.SKIP_LINES
          );
          if (skipLinesPrefix) {
            parsedTSV = parsedTSV.filter(
              row => !row[0].startsWith(skipLinesPrefix)
            );
          }

          const tsv2File = this.tsvService.getTSV2FileFromArray(
            this.dataset,
            this.sessionData,
            parsedTSV
          );

          let headers = tsv2File.getHeadersForSpreadSheet();
          let body = tsv2File.getBody();

          // if not in modal, limit the rows if needed
          this.limitRows = !this.modalMode && body.length > this.maxRowsLimit;
          this.rowCountBeforeLimit = body.length;
          if (this.limitRows) {
            body = body.slice(0, this.maxRowsLimit);
          }
          this.rowCount = body.length;

          // if there is only one line, show it as content, because Handsontable doesn't allow
          // headers to be shown alone
          if (body.length === 0) {
            body = [headers];
            headers = null;
            this.rowCount = 0;
          }

          // set the text after full screen link
          if (!this.modalMode) {
            if (this.gotFullFile && !this.limitRows) {
              this.goToFullScreenText = "";
            } else if (this.gotFullFile && this.limitRows) {
              this.goToFullScreenText = " to see all rows";
            } else if (!this.gotFullFile && this.modalWillHaveFullFile) {
              this.goToFullScreenText = " to see all rows and total row count";
            } else if (!this.gotFullFile && !this.modalWillHaveFullFile) {
              this.goToFullScreenText =
                " to see more rows. File is too big for total row count";
            }
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
