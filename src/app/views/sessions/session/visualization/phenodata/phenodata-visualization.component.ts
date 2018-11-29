import Utils from "../../../../../shared/utilities/utils";
import { Dataset, MetadataEntry } from "chipster-js-common";
import { SessionDataService } from "../../session-data.service";
import * as _ from "lodash";
import {
  Component,
  Input,
  SimpleChanges,
  ViewEncapsulation,
  NgZone,
  OnDestroy,
  OnChanges,
  OnInit,
  AfterViewInit
} from "@angular/core";
import { Row } from "./phenodatarow.interface";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { TSVReader } from "../../../../../shared/services/TSVReader";
import { SessionEventService } from "../../session-event.service";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { Observable } from "rxjs/Observable";
import { SpreadsheetService } from "../../../../../shared/services/spreadsheet.service";
import { ViewChild } from "@angular/core";
import { NativeElementService } from "../../../../../shared/services/native-element.service";
import log from "loglevel";

@Component({
  selector: "ch-phenodata-visualization",
  templateUrl: "./phenodata-visualization.component.html",
  styleUrls: ["./phenodata-visualization.component.less"],
  // disable ViewEncapsulation.Emulated, because we want dynamically add a style to the
  // remove column button, but an emulated view encapsulation would mess up style names
  encapsulation: ViewEncapsulation.None
})
export class PhenodataVisualizationComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() private datasets: Array<Dataset>;
  @Input() private datasetsMap: Map<string, Dataset>;

  // MUST be handled outside Angular zone to prevent a change detection loop
  hot: ht.Methods;
  array: Row[];
  headers: string[];
  latestEdit: number;
  deferredUpdatesTimerId: number | null = null;
  unremovableColumns = ["sample", "original_name", "dataset", "column"];

  constructor(
    private sessionDataService: SessionDataService,
    private tsvReader: TSVReader,
    private stringModalService: DialogModalService,
    private sessionEventService: SessionEventService,
    private zone: NgZone,
    private restErrorService: RestErrorService,
    private spreadsheetService: SpreadsheetService,
    private nativeElementService: NativeElementService
  ) {}

  @ViewChild("horizontalScroll") horizontalScrollDiv;

  ngOnInit() {
    this.updateView();

    // update view if someone else has edited the phenodata
    this.sessionEventService.getDatasetStream().subscribe(() => {
      this.updateViewLater();
    });
  }

  ngAfterViewInit() {
    // not created in modal
    if (this.horizontalScrollDiv) {
      this.nativeElementService.disableGestures(
        this.horizontalScrollDiv.nativeElement
      );
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (propName === "datasets") {
        if (this.datasets.length > 0) {
          this.updateViewLater();
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.hot) {
      this.zone.runOutsideAngular(() => {
        this.hot.destroy();
        this.hot = null;
      });
    }
  }

  getWidth(array: string[][], headers: string[]) {
    return this.spreadsheetService.guessWidth(headers, array) + 100;
  }

  getHeight(array: string[][], headers: string[]) {
    return array.length * 23 + 50; // extra for header-row and borders
  }

  updateSize(array: string[][], headers: string[]) {
    const container = document.getElementById("tableContainer");

    container.style.width = this.getWidth(array, headers) + "px";
    container.style.height = this.getHeight(array, headers) + "px";
  }

  getSettings(array: string[][], headers: string[]) {
    return {
      data: array,
      colHeaders: headers,
      columnSorting: true,
      manualColumnResize: true,
      sortIndicator: true,
      rowHeights: 23,
      scrollColHeaders: false,
      scrollCompatibilityMode: false,
      renderAllRows: false,
      width: this.getWidth(array, headers),
      height: this.getHeight(array, headers),

      afterGetColHeader: (col: number, TH: any) => {
        if (this.unremovableColumns.indexOf(headers[col]) !== -1) {
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
        if (
          source === "edit" ||
          source === "Autofill.fill" ||
          source === "CopyPaste.paste"
        ) {
          this.latestEdit = new Date().getTime();
          this.updateDatasets(false);
        }
      }
    };
  }

  createRemoveButton(col: number, TH: any) {
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

    this.updateDatasets(false);
  }

  reset() {
    this.datasets.forEach((dataset: Dataset) => this.resetDataset(dataset));
  }

  resetDataset(dataset: Dataset) {
    if (Utils.getFileExtension(dataset.name) === "tsv") {
      this.resetTsv(dataset);
    } else {
      this.resetGenericFile(dataset);
    }
  }

  remove() {
    this.datasets.forEach((dataset: Dataset) => {
      dataset.metadata = null;
    });

    this.updateView();
    this.updateDatasets(true);
  }

  resetTsv(dataset: Dataset) {
    this.tsvReader
      .getTSVFileHeaders(this.sessionDataService.getSessionId(), dataset)
      .subscribe((fileHeaders: string[]) => {
        const metadata: MetadataEntry[] = [];

        const chipHeaders = fileHeaders.filter(function(header) {
          return Utils.startsWith(header, "chip.");
        });

        chipHeaders.forEach(fileHeader => {
          metadata.push(<MetadataEntry>{
            column: fileHeader,
            key: "sample",
            value: fileHeader.replace("chip.", "")
          });
          metadata.push(<MetadataEntry>{
            column: fileHeader,
            key: "group",
            value: null
          });
        });

        dataset.metadata = metadata;

        this.updateView();
        this.updateDatasets(true);
      });
  }

  resetGenericFile(dataset: Dataset) {
    /*
    dataset.metadata = [{
      column: null,
      key: 'sample',
      value: dataset.name
    }];
    */
    dataset.metadata = [
      {
        column: null,
        key: "group",
        value: null
      }
    ];

    this.updateView();
    this.updateDatasets(true);
  }

  getHeaders(datasets: Dataset[]) {
    // collect all headers
    const headers = {
      dataset: true,
      column: true
    };
    datasets.forEach((dataset: Dataset) => {
      if (dataset.metadata) {
        dataset.metadata.forEach((entry: MetadataEntry) => {
          headers[entry.key] = true;
        });
      }
    });
    return Object.keys(headers);
  }

  createRow(length: number, datasetId: string, columnName: string) {
    // create a plain JS array, because Handsontable doesn't recognize typescript Array
    // and doesn't allow columns to be added on object data source
    const row = <Row>[];
    for (let i = 0; i < length; i++) {
      row.push(undefined);
    }
    row.datasetId = datasetId;
    row.columnName = columnName;

    return row;
  }

  // get the row of a specific dataset and column if it exists already
  // or create a new row
  getRow(dataset: Dataset, column: string, array: Row[], headers: string[]) {
    // find the existing row
    for (let i = 0; i < array.length; i++) {
      if (
        array[i].datasetId === dataset.datasetId &&
        array[i].columnName === column
      ) {
        return array[i];
      }
    }

    // create a new row
    // fill the row with undefined values
    const row = this.createRow(headers.length, dataset.datasetId, column);

    row[0] = dataset.name;
    row[1] = column;

    return row;
  }

  getRows(datasets: Dataset[], headers: string[]) {
    const array: Row[] = [];

    datasets.forEach((dataset: Dataset) => {
      if (dataset.metadata) {
        if (dataset.metadata.length > 0) {
          dataset.metadata.forEach((entry: MetadataEntry) => {
            const row = this.getRow(dataset, entry.column, array, headers);
            row[headers.indexOf(entry.key)] = entry.value;
            if (array.indexOf(row) === -1) {
              array.push(row);
            }
          });
        } else {
          const row = this.getRow(dataset, null, array, headers);
          array.push(row);
        }
      }
    });
    return array;
  }

  updateDatasets(updateAll: boolean) {
    const metadataMap = new Map<string, MetadataEntry[]>();
    const array = this.array;
    const headers = this.headers;

    array.forEach((row: Row) => {
      for (let i = 0; i < headers.length; i++) {
        // dataset and column are only presented for the user
        // the column information will be stored to entries
        // and the dataset information is unnecessary, because each dataset has it's own metadata
        if (headers[i] === "dataset" || headers[i] === "column") {
          continue;
        }

        const entry = {
          column: row.columnName,
          key: headers[i],
          value: row[i]
        };

        if (!metadataMap.has(row.datasetId)) {
          metadataMap.set(row.datasetId, []);
        }

        metadataMap.get(row.datasetId).push(entry);
      }
    });

    const updates: Observable<any>[] = [];

    this.datasets.forEach((dataset: Dataset) => {
      const newMetadata = metadataMap.get(dataset.datasetId);

      if (updateAll || !_.isEqual(newMetadata, dataset.metadata)) {
        dataset.metadata = newMetadata;
        updates.push(this.sessionDataService.updateDataset(dataset));
      }
    });

    Observable.forkJoin(updates).subscribe(
      () => log.info(updates.length + " datasets updated"),
      err => this.restErrorService.handleError(err, "dataset updates failed")
    );
  }

  updateView() {
    // get the latest datasets from the sessionData, because websocket events
    // don't update selectedDatasets at the moment
    this.datasets = this.datasets.map(dataset =>
      this.datasetsMap.get(dataset.datasetId)
    );

    // generate phenodata for all datasets that don't have it yet
    this.datasets
      .filter(d => !d.metadata || d.metadata.length === 0)
      .map(d => this.resetDataset(d));

    const headers = this.getHeaders(this.datasets);
    const array = this.getRows(this.datasets, headers);

    if (!_.isEqual(headers, this.headers)) {
      this.hideColumnIfEmpty(headers, array);

      this.headers = headers;

      // remove old table if this is an update
      const container = document.getElementById("tableContainer");

      if (!container) {
        // timer or event triggered the update
        log.info(
          "cancelling the phenodata update, because the container has been removed already"
        );
        return;
      }

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      this.zone.runOutsideAngular(() => {
        this.hot = new Handsontable(
          container,
          this.getSettings(array, this.headers)
        );
      });
    }

    this.updateSize(array, headers);

    this.array = array;
    this.zone.runOutsideAngular(() => {
      if (this.hot) {
        this.hot.loadData(this.array);
      }
    });
  }

  isEditingNow() {
    return new Date().getTime() - this.latestEdit < 1000;
  }

  updateViewLater() {
    if (!this.isEditingNow()) {
      this.updateView();
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
            this.updateView();
          }
        }, 100);
      }
    }
  }

  addColumnModal() {
    this.stringModalService
      .openStringModal("Add new column", "Column name", "", "Add")
      .do(name => {
        this.zone.runOutsideAngular(() => {
          const colHeaders = <Array<string>>(
            (<ht.Options>this.hot.getSettings()).colHeaders
          );
          this.hot.alter("insert_col", colHeaders.length);
          // remove undefined column header
          colHeaders.pop();
          colHeaders.push(name);
          this.hot.updateSettings(
            {
              colHeaders: colHeaders
            },
            false
          );
        });

        this.updateDatasets(false);
      })
      .subscribe(null, err =>
        this.restErrorService.handleError(err, "Add column failed")
      );
  }

  private hideColumnIfEmpty(headers: string[], array: Row[]) {
    // if the columnName is undefined on all rows (non-microarray phenodata)
    if (array.filter(row => !!row.columnName).length === 0) {
      const index = headers.indexOf("column");
      // remove the column from the headers
      headers.splice(index, 1);
      // and from the array
      array.forEach(row => row.splice(index, 1));
    }
  }
}
