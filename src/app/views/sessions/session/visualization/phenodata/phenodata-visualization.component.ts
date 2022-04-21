import {
  AfterViewInit,
  Component,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { Dataset } from "chipster-js-common";
import * as d3 from "d3";
import log from "loglevel";
import { Subject } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { NativeElementService } from "../../../../../shared/services/native-element.service";
import { SpreadsheetService } from "../../../../../shared/services/spreadsheet.service";
import { DatasetService } from "../../dataset.service";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { GetSessionDataService } from "../../get-session-data.service";
import { SessionDataService } from "../../session-data.service";
import { SessionEventService } from "../../session-event.service";

export enum PhenodataState {
  OWN_PHENODATA,
  INHERITED_PHENODATA,
  NO_PHENODATA,
  DATASET_NULL,
}

@Component({
  selector: "ch-phenodata-visualization",
  templateUrl: "./phenodata-visualization.component.html",
  styleUrls: ["./phenodata-visualization.component.less"],
  // disable ViewEncapsulation.Emulated, because we want dynamically add a style to the
  // remove column button, but an emulated view encapsulation would mess up style names
  encapsulation: ViewEncapsulation.None,
})
export class PhenodataVisualizationComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() private dataset: Dataset;
  @Input() private datasetsMap: Map<string, Dataset>;

  // MUST be handled outside Angular zone to prevent a change detection loop
  hot;
  rows: Array<Array<string>>;
  headers: string[];
  latestEdit: number;
  deferredUpdatesTimerId: number | null = null;
  unremovableColumns = ["sample", "original_name"];
  PhenodataState = PhenodataState; // for using the enum in template
  phenodataState: PhenodataState = PhenodataState.DATASET_NULL;
  phenodataAncestor: Dataset;
  phenodataFilled = false;
  ready = false;
  sortColumn: number;
  sortOrder: boolean;
  sortingEnabled: boolean;
  phenodataString: string;

  private unsubscribe: Subject<any> = new Subject();

  constructor(
    private sessionDataService: SessionDataService,
    private stringModalService: DialogModalService,
    private sessionEventService: SessionEventService,
    private zone: NgZone,
    private restErrorService: RestErrorService,
    private spreadsheetService: SpreadsheetService,
    private nativeElementService: NativeElementService,
    private errorService: ErrorService,
    private getSessionDataService: GetSessionDataService,
    private datasetService: DatasetService
  ) {}

  @ViewChild("horizontalScroll") horizontalScrollDiv;

  ngOnInit() {
    this.updateViewAfterDelay();

    // update view if someone else has edited the phenodata
    this.sessionEventService
      .getDatasetStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (event) => {
          // TODO if phenodata view starts to use fields other than the phenodata (such as name) and needs to react
          // to updates of those fields, add needed changes below. Now event stream causes update only if phenodata
          // has been changed

          // only react to events of this dataset
          if (this.dataset == null || this.dataset.datasetId !== (event.newValue as Dataset)?.datasetId) {
            return;
          }

          // get the latest datasets from the sessionData, because websocket events
          // don't update selectedDatasets at the moment
          // in this case, could use the one from the event also?
          const updatedDataset = this.datasetsMap.get(this.dataset.datasetId);

          if (this.datasetService.getOwnPhenodata(updatedDataset) === this.phenodataString) {
            return;
          }

          // someone else has changed phenodata, update
          this.updateViewLater();
        },
        (err) => this.errorService.showError("phenodata update failed", err)
      );
  }

  ngAfterViewInit() {
    // not created in modal
    if (this.horizontalScrollDiv) {
      this.nativeElementService.disableGestures(this.horizontalScrollDiv.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (propName === "dataset") {
        if (this.dataset) {
          console.log("ON CHANGES");
          this.updateViewLater();
        }
      }
    }
  }

  ngOnDestroy() {
    console.log("ON DESTROY");
    this.unsubscribe.next();
    this.unsubscribe.complete();

    if (this.hot) {
      this.zone.runOutsideAngular(() => {
        this.hot.destroy();
        this.hot = null;
      });
    }
  }

  private getWidth(array: string[][], headers: string[]) {
    return this.spreadsheetService.guessWidth(headers, array) + 100;
  }

  private getHeight(array: string[][]) {
    return array.length * 23 + 50; // extra for header-row and borders
  }

  private updateSize(array: string[][], headers: string[]) {
    const container = document.getElementById("tableContainer");

    container.style.width = this.getWidth(array, headers) + "px";
    container.style.height = this.getHeight(array) + "px";
  }

  private getSettings(array: string[][], headers: string[]) {
    const columnSorting = this.sortingEnabled
      ? {
          column: this.sortColumn,
          sortOrder: this.sortOrder,
          sortEmptyCells: true,
        }
      : { columnSorting: true };

    return {
      data: array,
      colHeaders: headers,
      columnSorting,
      manualColumnResize: true,
      sortIndicator: true,
      rowHeights: 23,
      scrollColHeaders: false,
      scrollCompatibilityMode: false,
      renderAllRows: false,
      width: this.getWidth(array, headers),
      height: this.getHeight(array),

      afterGetColHeader: (col: number, TH: any) => {
        if (this.unremovableColumns.includes(headers[col])) {
          // removal not allowed
          return;
        }
        this.createRemoveButton(col, TH);
      },

      afterChange: (changes: any, source: string) => {
        /*
         Cut two-way binding loops here.

         If the user edited the table (source === 'edit'),
         then the scope and server must be updated also. The same applies for
         'paste' and 'autofill'. The latter are created when copying cells by
         dragging the small rectangle in the corner of the selection.

         But if the change came from the scope (source === 'loadData'), then
         we must not update the scope, because it would create an infinite
         loop.
         */
        // log.info(source);
        if (source === "edit" || source === "Autofill.fill" || source === "CopyPaste.paste") {
          this.latestEdit = new Date().getTime();
          this.updateDataset();
        }
      },
    };
  }

  private createRemoveButton(col: number, TH: any) {
    const button = document.createElement("A");
    button.className = "pull-right";
    // use id instead of class to make it more specific than the 'color: inherit' rule in the bootstrap styles
    button.id = "phenodata-header-button";
    button.innerHTML = "&times;";

    button.addEventListener(
      "click",
      () => {
        this.removeColumn(col);
      },
      false
    );

    if (TH.firstChild.lastChild.nodeName === "A") {
      TH.firstChild.removeChild(TH.firstChild.lastChild);
    }
    TH.firstChild.appendChild(button);
  }

  removeColumn(index: number) {
    this.zone.runOutsideAngular(() => {
      this.hot.alter("remove_col", index);
    });

    this.updateDataset();
  }

  /**
   * FIXME Generates server update for each column to be removed, also possibly causes problems when
   * receiving updates from server while removing rest of the columns
   *
   * Maybe refactor so that take unremovable columns and make new phenodata string out of them.
   *
   */
  reset() {
    // do something only if there are removable columns
    if (this.headers.some((columnHeader: string) => !this.unremovableColumns.includes(columnHeader))) {
      // get indexes of removable columns
      const removableColumnIndexces = this.headers
        .map((columnHeader: string, index: number) => (!this.unremovableColumns.includes(columnHeader) ? index : -1))
        .filter((index) => index !== -1);

      // remove columns in reverse order to avoid messing up
      removableColumnIndexces.reverse().forEach((index) => this.removeColumn(index));

      this.updateViewAfterDelay();
      this.updateDataset();
    }
  }

  private updateDataset() {
    const phenodataString: string = [this.headers].concat(this.rows).reduce(
      (result: string, row: Array<string>) =>
        (result +=
          row
            .reduce((rowString: string, cellValue: string) => {
              const cellString = cellValue != null ? cellValue : "";
              return rowString + cellString + "\t";
            }, "")
            .slice(0, -1) + "\n"),
      ""
    );

    this.phenodataString = phenodataString;

    if (phenodataString !== this.datasetService.getOwnPhenodata(this.dataset)) {
      this.datasetService.setPhenodata(this.dataset, phenodataString);
      this.sessionDataService.updateDataset(this.dataset).subscribe(
        () => log.info("dataset phenodata updated"),
        (err) => this.restErrorService.showError("dataset phenodata update failed", err)
      );
    }
  }

  private updateViewAfterDelay() {
    setTimeout(() => this.updateView(), 200);
  }

  private updateView() {
    this.ready = false;
    this.phenodataFilled = false;
    this.phenodataAncestor = null;
    this.headers = [];
    this.rows = [];

    // store sorting state
    if (this.hot) {
      if (this.hot.sortingEnabled) {
        this.sortingEnabled = true;
        this.sortColumn = this.hot.sortColumn;
        this.sortOrder = this.hot.sortOrder;
      } else {
        this.sortingEnabled = false;
        this.sortColumn = null;
        this.sortOrder = null;
      }
    }

    // remove old table if this is an update
    const container = document.getElementById("tableContainer");
    if (!container) {
      // timer or event triggered the update
      log.info("cancelling the phenodata update, because the container has been removed already");
      return;
    }
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (this.dataset == null) {
      this.phenodataState = PhenodataState.DATASET_NULL;
      this.ready = true;
      return;
    }
    // get the latest datasets from the sessionData, because websocket events
    // don't update selectedDatasets at the moment
    this.dataset = this.datasetsMap.get(this.dataset.datasetId);
    if (this.dataset == null) {
      this.phenodataState = PhenodataState.DATASET_NULL;
      this.ready = true;
      return;
    }

    // find phenodata for this dataset, could be own or inherited
    let phenodataString;
    if (this.datasetService.hasOwnPhenodata(this.dataset)) {
      phenodataString = this.datasetService.getOwnPhenodata(this.dataset);
      this.phenodataState = PhenodataState.OWN_PHENODATA;
      this.phenodataFilled = this.datasetService.isPhenodataFilled(this.dataset);
    } else {
      const ancestorsWithPhenodata = this.getSessionDataService.getAncestorDatasetsWithPhenodata(this.dataset);
      if (ancestorsWithPhenodata.length > 0) {
        phenodataString = this.datasetService.getOwnPhenodata(ancestorsWithPhenodata[0]);
        this.phenodataState = PhenodataState.INHERITED_PHENODATA;
        this.phenodataAncestor = ancestorsWithPhenodata[0];
      } else {
        this.phenodataState = PhenodataState.NO_PHENODATA;
        this.ready = true;
        return;
      }
    }

    // parse the phenodata string
    if (phenodataString != null && phenodataString.length > 0) {
      const allRows = d3.tsvParseRows(phenodataString);
      this.headers = allRows[0];
      this.rows = allRows.length > 1 ? allRows.slice(1) : [];
    }

    // for now, show the phenodata table only for own phenodata
    const settings = this.getSettings(this.rows, this.headers);
    if (this.phenodataState === PhenodataState.OWN_PHENODATA) {
      this.zone.runOutsideAngular(() => {
        this.hot = new Handsontable(container, settings);
      });

      this.updateSize(this.rows, this.headers);

      this.zone.runOutsideAngular(() => {
        if (this.hot) {
          this.hot.loadData(this.rows);
        }
      });
    }

    this.ready = true;
  }

  private isEditingNow() {
    return new Date().getTime() - this.latestEdit < 1000;
  }

  private updateViewLater() {
    if (!this.isEditingNow()) {
      this.updateViewAfterDelay();
    } else {
      /*
       Defer updates when the table is being edited

       Imagine the following sequence of events:
       1. user fills in row 1
       2. the changes are pushed to the server
       3. user fills in row 2
       4. we receive a notification about the first dataset change and update the table,
       reverting the users changes on the line 2
       5. user fills in row 3
       6. the changes are pushed to the server, including the reverted line 2

       The probability of this is now considerably reduced by delaying the updates in stage
       4 when the table is being edited.

       The other option would be to save some edit timestamps or edit sources on the server
       so that we could recognize the events that we have create ourselves and wouldn't have
       to apply them to the table.
       */

      if (this.deferredUpdatesTimerId == null) {
        this.deferredUpdatesTimerId = window.setInterval(() => {
          if (!this.isEditingNow()) {
            window.clearInterval(this.deferredUpdatesTimerId);
            this.deferredUpdatesTimerId = null;
            this.updateViewAfterDelay();
          }
        }, 100);
      }
    }
  }

  openAddColumnModal() {
    this.stringModalService
      .openStringModal("Add new column", "Column name", "", "Add")
      .pipe(
        tap((name) => {
          this.zone.runOutsideAngular(() => {
            const colHeaders = (this.hot.getSettings() as ht.Options).colHeaders as Array<string>;
            this.hot.alter("insert_col", colHeaders.length);
            // remove undefined column header
            colHeaders.pop();
            colHeaders.push(name);
            this.hot.updateSettings(
              {
                colHeaders,
              },
              false
            );
          });

          this.updateDataset();
        })
      )
      .subscribe(null, (err) => this.restErrorService.showError("Add column failed", err));
  }
}
