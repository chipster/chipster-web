import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import * as d3 from "d3";
import log from "loglevel";
import { Subject } from "rxjs";
import { mergeMap, takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../../model/loadstate";
import { SessionData } from "../../../../model/session/session-data";
import TSV2File from "../../../../model/tsv/TSV2File";
import { FileResource } from "../../../../shared/resources/fileresource";
import { TsvService } from "../../../../shared/services/tsv.service";
import {
  Tags,
  TypeTagService
} from "../../../../shared/services/typetag.service";
import { DatasetService } from "../dataset.service";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
import { SessionDataService } from "../session-data.service";

enum ColumnType {
  Identifier,
  Sample
}

interface ColumnItem {
  index: number;
  name: string;
}

@Component({
  selector: "ch-wrangle-modal",
  templateUrl: "./wrangle-modal.component.html",
  styleUrls: ["./wrangle-modal.component.less"]
})
export class WrangleModalComponent implements OnInit {
  constructor(
    public activeModal: NgbActiveModal,
    private fileResource: FileResource,
    private sessionDataService: SessionDataService,
    private typeTagService: TypeTagService,
    private restErrorService: RestErrorService,
    private tsvService: TsvService,
    private datasetService: DatasetService,
    private dialogModalService: DialogModalService
  ) {}
  @Input() dataset: Dataset;
  @Input() sessionData: SessionData;

  @ViewChild("agGrid") agGrid;
  @ViewChild("identifierButton") identifierButton;
  @ViewChild("sampleButton") sampleButton;

  @ViewChild("sampleDropdown") sampleDropdown;

  private readonly SAMPLE_PREFIX = "chip.";
  private readonly selectAllString = "Select all";
  private readonly selectAllFilteredString = "Select all filtered";

  public static FILE_SIZE_LIMIT = 100 * 1024 * 1024;
  private readonly previewRowCount = 3;

  identifierItems: ColumnItem[];
  identifierColumn: ColumnItem;

  sampleItems: ColumnItem[];
  sampleColumns: ColumnItem[] = [];
  filteredSampleItems: ColumnItem[] = [];

  columnDefs = [];
  tsv2File: TSV2File;
  previewRowData = [];
  columnTypes: Array<ColumnType> = [];

  selectAllButtonText = this.selectAllString;

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;
  next: () => {};

  ngOnInit(): void {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading data...");

    // check for empty file
    if (this.dataset.size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }

    // file max limit is checked before opening the modal

    // get file contents
    this.fileResource
      .getData(
        this.sessionDataService.getSessionId(),
        this.dataset,
        this.dataset.size
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (result: any) => {
          // sanity check

          if (result.length !== this.dataset.size) {
            log.warn(
              `before wrangle download content size is ${result.length} while dataset size is ${this.dataset.size}`
            );
          }

          // parse all loaded data
          let parsedTSV = d3.tsvParseRows(result);

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

          this.tsv2File = this.tsvService.getTSV2FileFromArray(
            this.dataset,
            this.sessionData,
            parsedTSV
          );

          const headers = this.tsv2File.getHeadersForSpreadSheet();

          // create column selection dropdown items
          this.identifierItems = headers.map(
            (headerName: string, index: number) => {
              return index === 0 && headerName === ""
                ? {
                    index: index,
                    name: "R rownames column"
                  }
                : { index: index, name: headerName };
            }
          );
          this.sampleItems = [...this.identifierItems];
          this.filteredSampleItems = [...this.identifierItems];

          // create column definitions, use numbers as column fields
          this.columnDefs = headers.map((header: string, i: number) => ({
            headerName: header,
            field: "" + i,
            // onCellClicked: this.onCellClicked.bind(this),
            cellClass: this.getCellClass.bind(this)
            // editable: true
          }));

          // create rowData for the preview
          this.previewRowData = this.tsv2File
            .getBody()
            .slice(0, this.previewRowCount)
            .map((row: string[]) => Object.assign({}, row));

          this.state = new LoadState(State.Ready);
        },
        (error: Response) => {
          this.state = new LoadState(State.Fail, "Loading data failed");
          this.restErrorService.showError(this.state.message, error);
        }
      );
  }

  getCellClass(params) {
    // if (
    //   this.sampleColumns.some(
    //     (columnItem: ColumnItem) =>
    //       parseInt(params.colDef.field) === columnItem.index
    //   )
    // ) {
    //   return "sample";
    // } else if (
    //   this.identifierColumn != null &&
    //   parseInt(params.colDef.field) === this.identifierColumn.index
    // ) {
    //   return "identifier";
    // } else {
    //   return "other";
    // }
    return "other";
  }

  public getSampleColumnNames(): Array<string> {
    return this.sampleColumns.map((columnItem: ColumnItem) => columnItem.name);
  }

  onSampleSearch(event) {
    this.filteredSampleItems = event.items;
    this.selectAllButtonText =
      event.term.length > 0
        ? this.selectAllFilteredString
        : this.selectAllString;
  }

  onSampleKeyDownEnter(event) {
    event.stopImmediatePropagation();
    this.addFilteredToSampleColumns();
    this.sampleDropdown.close();
  }

  onSampleChange(event) {
    // seems to be needed for applying changed styles
    this.agGrid.api.redrawRows(); // refreshCells() wasn't enough
  }

  onSampleOpen(event) {
    this.selectAllButtonText = this.selectAllString;
    this.filteredSampleItems = this.sampleItems;
  }

  onIdentifierChange(event) {
    this.agGrid.api.redrawRows(); // refreshCells() wasn't enough
  }

  onSampleSelectAll(): void {
    this.addFilteredToSampleColumns();
    this.sampleDropdown.close();
  }

  private addFilteredToSampleColumns(): void {
    this.sampleColumns = this.sampleColumns.concat(
      this.filteredSampleItems.filter(
        sampleItem => !this.sampleColumns.includes(sampleItem)
      )
    );
  }

  public getSampleColumnNamesString(): string {
    return this.getSampleColumnNames().join(" ");
  }

  /**
   * Creates the observable that performs the wrangle operation,
   * closes the modal and returns the observable when closing the modal.
   *
   */
  public runWrangle(): void {
    // get the contents of the new file as a string
    const wrangledFileString = this.getWrangledFileString();

    // create the new (derived) dataset
    const wrangle$ = this.sessionDataService
      .createDerivedDataset(
        this.dataset.name + "-converted.tsv",
        [this.dataset.datasetId],
        "Convert to Chipster format",
        wrangledFileString,
        "Import"
      )
      .pipe(
        mergeMap(newDatasetId => {
          // get newly created dataset (from the server, might not be available locally yet)
          return this.sessionDataService.getDataset(newDatasetId);
        }),
        mergeMap((newDataset: Dataset) => {
          // create phenodata and update it to server
          const phenodataString = this.getPhenodataString();
          newDataset.metadataFiles = [
            {
              name: this.datasetService.DEFAULT_PHENODATA_FILENAME,
              content: phenodataString
            }
          ];
          return this.sessionDataService.updateDataset(newDataset);
        })
      );
    this.activeModal.close(wrangle$);
  }
  private getSampleColumnIndexes(): number[] {
    return this.sampleColumns
      .map((columnItem: ColumnItem) => columnItem.index)
      .sort((a, b) => a - b); // sort them just in case selection order or something messes the order
  }

  private getWrangledFileString(): string {
    const sampleColumnIndexes = this.getSampleColumnIndexes();

    const newRows = this.tsv2File.getBody().map((tsvRow: Array<string>) => {
      return [tsvRow[this.identifierColumn.index]].concat(
        sampleColumnIndexes.map((index: number) => tsvRow[index])
      );
    });

    const tsvHeaders = this.tsv2File.getHeadersForSpreadSheet();
    const newHeaders = sampleColumnIndexes
      .map((index: number) => tsvHeaders[index])
      // add prefix if missing
      .map(headerName =>
        headerName.startsWith(this.SAMPLE_PREFIX)
          ? headerName
          : this.SAMPLE_PREFIX + headerName
      );

    // arrays to strings
    const newHeadersString = d3.tsvFormatRows([newHeaders]);
    const newRowsString = d3.tsvFormatRows(newRows); // will escape for example tabs in values

    return newHeadersString + "\n" + newRowsString;
  }

  private getPhenodataString(): string {
    const phenodataHeaderString = "sample\toriginal_name\tchiptype\tgroup\n";
    const tsvHeaders = this.tsv2File.getHeadersForSpreadSheet();

    const phenodataRowsString = this.getSampleColumnIndexes().reduce(
      (phenodataRows: string, index) =>
        phenodataRows +
        tsvHeaders[index].substring(this.SAMPLE_PREFIX.length) +
        "\t" +
        this.dataset.name +
        "\t" +
        "not applicaple" +
        "\t" +
        "" +
        "\n",
      ""
    );

    return phenodataHeaderString + phenodataRowsString;
  }

  // onCellClicked(params): void {
  //   console.log("SAMPLES", this.sampleColumns);

  //   const colField = params.colDef.field;
  //   console.log("CLICKED ON COL", colField);

  //   if (this.identifierButtonState) {
  //     if (this.identifierColumn !== colField) {
  //       this.identifierColumn = colField;
  //       if (this.sampleColumns.has(colField)) {
  //         this.sampleColumns.delete(colField);
  //       }
  //     } else {
  //       this.identifierColumn = null;
  //     }
  //   } else if (this.sampleButtonState) {
  //     if (!this.sampleColumns.has(colField)) {
  //       this.sampleColumns.add(colField);
  //       if (this.identifierColumn === colField) {
  //         this.identifierColumn = null;
  //       }
  //     } else {
  //       this.sampleColumns.delete(colField);
  //     }
  //   }

  //   // if (!this.sampleColumns.has(colField)) {
  //   //   this.sampleColumns.add(colField);
  //   // } else {
  //   //   this.sampleColumns.delete(colField);
  //   // }
  //   // this.sampleColumns.delete(colField);
  //   // this.agGrid.api.refreshCells();
  //   this.agGrid.api.redrawRows(); // refreshCells() wasn't enough
  //   console.log("AG GRID", this.agGrid);
  // }

  // onIdentifierButtonClick() {
  //   this.identifierButtonState = true;
  //   this.sampleButtonState = false;
  // }

  // onSampleButtonClick() {
  //   this.sampleButtonState = true;
  //   this.identifierButtonState = false;
  //   // console.log("BUTTON", this.identifierButton);
  // }
}
