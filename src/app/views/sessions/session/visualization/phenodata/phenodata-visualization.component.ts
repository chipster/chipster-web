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
  @Input() private dataset!: Dataset;
  @Input() private datasetsMap!: Map<string, Dataset>;

  // MUST be handled outside Angular zone to prevent a change detection loop
  hot: any;
  rows: Array<Array<string>> = [];
  headers: string[] = [];
  latestEdit = 0;
  deferredUpdatesTimerId: number | undefined = undefined;
  nonEditableColumns = ["sample", "original_name"];
  private originalPhenodataString: string | null = null;
  private originalDatasetId: string | null = null;

  get hasEditableColumns(): boolean {
    return this.headers.some((h) => !this.nonEditableColumns.includes(h));
  }

  get hasEditableValues(): boolean {
    const editableIndices = this.headers
      .map((h, i) => (this.nonEditableColumns.includes(h) ? -1 : i))
      .filter((i) => i !== -1);
    return this.rows.some((row) => editableIndices.some((i) => row[i] != null && row[i] !== ""));
  }

  get canReset(): boolean {
    return this.hasEditableColumns || (this.originalPhenodataString != null && this.originalPhenodataString !== this.phenodataString);
  }
  PhenodataState = PhenodataState; // for using the enum in template
  phenodataState: PhenodataState = PhenodataState.DATASET_NULL;
  phenodataAncestor: Dataset | null = null;
  phenodataFilled = false;
  groupColumnMissing = false;
  ready = false;
  sortColumn: number | null = null;
  sortOrder: boolean | null = null;
  sortingEnabled = false;
  phenodataString = "";

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
    private datasetService: DatasetService,
  ) {}

  @ViewChild("horizontalScroll") horizontalScrollDiv;

  ngOnInit() {
    this.updateViewAfterDelay();

    // update view if someone else has edited the phenodata
    this.sessionEventService
      .getDatasetStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (event) => {
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
          if (updatedDataset == null) {
            return;
          }

          if (this.datasetService.getOwnPhenodata(updatedDataset) === this.phenodataString) {
            return;
          }

          // someone else has changed phenodata, update
          this.updateViewLater();
        },
        error: (err) => this.errorService.showError("phenodata update failed", err),
      });
  }

  ngAfterViewInit() {
    // not created in modal
    if (this.horizontalScrollDiv) {
      this.nativeElementService.disableGestures(this.horizontalScrollDiv.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (Object.keys(changes).includes("dataset") && this.dataset) {
      this.updateViewLater();
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
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
    if (!container) {
      return;
    }
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
        if (this.nonEditableColumns.includes(headers[col])) {
          // removal not allowed
          return;
        }
        this.createRemoveButton(col, TH);
      },

      cells: (_row: number, col: number) => {
        if (this.nonEditableColumns.includes(headers[col])) {
          return { readOnly: true };
        }
        return {};
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
          this.zone.run(() => this.updateWarnings());
        }
      },
    };
  }

  private createRemoveButton(col: number, TH: any) {
    const button = document.createElement("A");
    button.className = "float-end";
    // use id instead of class to make it more specific than the 'color: inherit' rule in the bootstrap styles
    button.id = "phenodata-header-button";
    button.innerHTML = '<i class="fas fa-xmark"></i>';
    button.title = "Remove column";

    button.addEventListener(
      "click",
      () => {
        this.zone.run(() => {
          const columnName = this.headers[col];
          this.stringModalService
            .openBooleanModal("Delete column", `Are you sure you want to delete column '${columnName}'?`, "Delete", "Cancel")
            .then(() => this.removeColumn(col), () => {});
        });
      },
      false,
    );

    const existing = TH.firstChild.querySelector("#phenodata-header-button");
    if (existing) {
      existing.remove();
    }
    TH.firstChild.insertBefore(button, TH.firstChild.firstChild);
  }

  removeColumn(index: number) {
    this.zone.runOutsideAngular(() => {
      this.hot.alter("remove_col", index);
    });

    this.updateDataset();
    this.zone.run(() => this.updateWarnings());
  }

  /**
   * FIXME Generates server update for each column to be removed, also possibly causes problems when
   * receiving updates from server while removing rest of the columns
   *
   * Maybe refactor so that take unremovable columns and make new phenodata string out of them.
   *
   */
  reset() {
    if (!this.canReset) {
      return;
    }
    this.stringModalService
      .openChoiceModal(
        "Reset phenodata",
        "You can clear the values in editable columns, delete all editable columns, or reset the phenodata to the state it was in when you opened this view.",
        "What would you like to do?",
        { text: "Delete columns", disabled: !this.hasEditableColumns },
        { text: "Clear values", disabled: !this.hasEditableValues },
        "Cancel",
        { text: "Reset to previous", disabled: this.originalPhenodataString === this.phenodataString },
      )
      .then((action: number) => {
        if (action === 1) {
          const keepIndices = this.headers
            .map((h, i) => (this.nonEditableColumns.includes(h) ? i : -1))
            .filter((i) => i !== -1);
          this.headers = keepIndices.map((i) => this.headers[i]);
          this.rows = this.rows.map((row) => keepIndices.map((i) => row[i]));
          this.updateDataset();
          this.updateViewAfterDelay();
        } else if (action === 2) {
          const removableIndices = this.headers
            .map((h, i) => (this.nonEditableColumns.includes(h) ? -1 : i))
            .filter((i) => i !== -1);
          this.rows.forEach((_row, rowIndex) => {
            removableIndices.forEach((colIndex) => {
              this.rows[rowIndex][colIndex] = "";
            });
          });
          this.updateDataset();
          this.updateViewAfterDelay();
          this.zone.run(() => this.updateWarnings());
        } else if (action === 3 && this.originalPhenodataString != null) {
          this.datasetService.setPhenodata(this.dataset, this.originalPhenodataString);
          this.phenodataString = this.originalPhenodataString;
          this.sessionDataService.updateDataset(this.dataset).subscribe({
            next: () => log.info("dataset phenodata updated"),
            error: (err) => this.restErrorService.showError("dataset phenodata update failed", err),
          });
          this.updateViewAfterDelay();
        }
      }, () => {});
  }

  private updateDataset() {
    const phenodataString = [this.headers, ...this.rows]
      .map((row) => row.map((cell) => cell ?? "").join("\t"))
      .join("\n") + "\n";

    this.phenodataString = phenodataString;

    if (phenodataString !== this.datasetService.getOwnPhenodata(this.dataset)) {
      this.datasetService.setPhenodata(this.dataset, phenodataString);
      this.sessionDataService.updateDataset(this.dataset).subscribe({
        next: () => log.info("dataset phenodata updated"),
        error: (err) => this.restErrorService.showError("dataset phenodata update failed", err),
      });
    }
  }

  private updateViewAfterDelay() {
    setTimeout(() => this.updateView(), 200);
  }

  private updateWarnings() {
    this.phenodataFilled = this.datasetService.isPhenodataFilled(this.dataset);
    this.groupColumnMissing = !this.datasetService.hasGroupColumn(this.dataset);
  }

  private updateView() {
    this.ready = false;
    this.phenodataFilled = false;
    this.groupColumnMissing = false;
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
    const updatedDataset = this.datasetsMap.get(this.dataset.datasetId);
    if (updatedDataset == null) {
      this.phenodataState = PhenodataState.DATASET_NULL;
      this.ready = true;
      return;
    }
    this.dataset = updatedDataset;

    // find phenodata for this dataset, could be own or inherited
    let phenodataString;
    if (this.datasetService.hasOwnPhenodata(this.dataset)) {
      phenodataString = this.datasetService.getOwnPhenodata(this.dataset);
      this.phenodataState = PhenodataState.OWN_PHENODATA;
      if (this.dataset.datasetId !== this.originalDatasetId) {
        this.originalDatasetId = this.dataset.datasetId;
        this.originalPhenodataString = phenodataString;
      }
      this.phenodataString = phenodataString;
      this.phenodataFilled = this.datasetService.isPhenodataFilled(this.dataset);
      this.groupColumnMissing = !this.datasetService.hasGroupColumn(this.dataset);
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
    } else if (this.deferredUpdatesTimerId == null) {
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
      this.deferredUpdatesTimerId = window.setInterval(() => {
        if (!this.isEditingNow()) {
          window.clearInterval(this.deferredUpdatesTimerId);
          this.deferredUpdatesTimerId = undefined;
          this.updateViewAfterDelay();
        }
      }, 100);
    }
  }

  openAddColumnModal() {
    this.stringModalService
      .openStringModal("Add new column", "Column name", "", "Add")
      .pipe(
        tap((name) => {
          this.zone.runOutsideAngular(() => {
            const colHeaders = (this.hot.getSettings() as ht.Options).colHeaders as Array<string>;
            const lastNonEditableIdx = colHeaders.reduce(
              (acc, h, i) => (this.nonEditableColumns.includes(h) ? i : acc),
              -1,
            );
            const insertIndex =
              name === this.datasetService.GROUP_COLUMN ? lastNonEditableIdx + 1 : colHeaders.length;
            this.hot.alter("insert_col", insertIndex);
            // Handsontable inserts an undefined entry at insertIndex; replace it with the name.
            colHeaders[insertIndex] = name;
            this.hot.updateSettings(
              {
                colHeaders,
              },
              false,
            );
          });

          this.updateDataset();
          this.updateWarnings();
        }),
      )
      .subscribe({ error: (err) => this.restErrorService.showError("Add column failed", err) });
  }
}
