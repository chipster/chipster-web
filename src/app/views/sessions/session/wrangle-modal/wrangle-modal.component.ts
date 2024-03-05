import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import * as d3 from "d3";
import log from "loglevel";
import { Subject, defer, of } from "rxjs";
import { mergeMap, takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../../model/loadstate";
import { SessionData } from "../../../../model/session/session-data";
import TSV2File from "../../../../model/tsv/TSV2File";
import { FileResource } from "../../../../shared/resources/fileresource";
import { TsvService } from "../../../../shared/services/tsv.service";
import { Tags, TypeTagService } from "../../../../shared/services/typetag.service";
import { DatasetService } from "../dataset.service";
import { SessionDataService } from "../session-data.service";

enum ColumnType {
  Identifier,
  Sample,
}

export interface ColumnItem {
  index: number;
  name: string;
}

@Component({
  selector: "ch-wrangle-modal",
  templateUrl: "./wrangle-modal.component.html",
  styleUrls: ["./wrangle-modal.component.less"],
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
  ) {}

  public static FILE_SIZE_LIMIT = 200; // MB

  @Input() dataset: Dataset;
  @Input() sessionData: SessionData;

  @ViewChild("agGrid") agGrid;

  private readonly SAMPLE_PREFIX = "chip.";
  private readonly INCLUDE = "included";
  private readonly EXCLUDE = "excluded";

  private readonly previewRowCount = 3;

  allItems: ColumnItem[];

  identifierItems: ColumnItem[];
  selectedIdentifiers: ColumnItem[] = []; // this is an array to make things similar with other selection, the length should always be <= 1
  sampleItems: ColumnItem[];
  selectedSamples: ColumnItem[] = [];

  otherItems: ColumnItem[];
  selectedOthers: ColumnItem[] = [];

  columnDefs = [];
  tsv2File: TSV2File;
  previewRowData = [];
  columnTypes: Array<ColumnType> = [];

  includeExcludeOptions = [this.INCLUDE, this.EXCLUDE];
  includeExclude = new UntypedFormControl(this.INCLUDE);
  includeExcludeForm = new UntypedFormGroup({ includeExclude: this.includeExclude });

  nonUniqueIdentifiers = new Set<string>();
  nonUniqueIncludedColumns = new Set<string>();

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;
  next: () => {};

  ngOnInit(): void {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next(null);
    this.state = new LoadState(State.Loading, "Loading data...");

    // check for empty file
    if (this.dataset.size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }

    // file max limit is checked before opening the modal

    // get file contents
    this.fileResource
      .getData(this.sessionDataService.getSessionId(), this.dataset, this.dataset.size)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (result: any) => {
          // sanity check

          if (result.length !== this.dataset.size) {
            log.warn(
              `before wrangle download content size is ${result.length} while dataset size is ${this.dataset.size}`,
            );
          }

          // parse all loaded data
          let parsedTSV = d3.tsvParseRows(result);

          // filter out comment lines, e.g. lines starting with ## in a VCF file
          const skipLinesPrefix = this.typeTagService.get(this.sessionData, this.dataset, Tags.SKIP_LINES);
          if (skipLinesPrefix) {
            parsedTSV = parsedTSV.filter((row) => !row[0].startsWith(skipLinesPrefix));
          }

          this.tsv2File = this.tsvService.getTSV2FileFromArray(this.dataset, this.sessionData, parsedTSV);

          const headers = this.tsv2File.getHeadersForSpreadSheet();

          // create column selection dropdown items
          this.allItems = headers.map((headerName: string, index: number) =>
            index === 0 && headerName === ""
              ? {
                  index,
                  name: "R rownames column",
                }
              : { index, name: headerName },
          );

          this.identifierItems = [...this.allItems];
          this.sampleItems = [...this.allItems];
          this.otherItems = [...this.allItems];

          // create column definitions, use numbers as column fields
          this.columnDefs = headers.map((header: string, i: number) => ({
            headerName: header,
            field: "" + i,
            // onCellClicked: this.onCellClicked.bind(this),
            cellClass: this.getCellClass.bind(this),
            // editable: true
          }));

          // create rowData for the preview
          this.previewRowData = this.tsv2File
            .getBody()
            .slice(0, this.previewRowCount)
            .map((row: string[]) => ({ ...row }));

          this.state = new LoadState(State.Ready);
        },
        (error: Response) => {
          this.state = new LoadState(State.Fail, "Loading data failed");
          this.restErrorService.showError(this.state.message, error);
        },
      );
  }

  getCellClass(params): string {
    if (this.selectedIdentifiers.some((columnItem: ColumnItem) => parseInt(params.colDef.field) === columnItem.index)) {
      return "identifier";
    }
    if (this.selectedSamples.some((columnItem: ColumnItem) => parseInt(params.colDef.field) === columnItem.index)) {
      return "sample";
    }
    const columnInOthers = this.selectedOthers.some(
      (columnItem: ColumnItem) => parseInt(params.colDef.field) === columnItem.index,
    );
    if ((this.includeOthers() && columnInOthers) || (!this.includeOthers() && !columnInOthers)) {
      return "include";
    }
    return "exclude";
  }

  public onIncludeExcludeChange(): void {
    this.onSelectionChange();
  }

  public getSampleColumnNames(): Array<string> {
    return this.selectedSamples.map((columnItem: ColumnItem) => columnItem.name);
  }

  public getSampleColumnNamesString(): string {
    return this.getSampleColumnNames().join(" ");
  }

  public onIdentifierSelectionChange(event): void {
    this.selectedIdentifiers = event;

    this.checkIdentifiersUnique(this.selectedIdentifiers);

    this.sampleItems = this.allItems.filter(
      (item) => !this.selectedIdentifiers.concat(this.selectedOthers).includes(item),
    );

    this.otherItems = this.allItems.filter(
      (item) => !this.selectedIdentifiers.concat(this.selectedSamples).includes(item),
    );
    this.onSelectionChange();
  }

  public onSampleSelectionChange(event): void {
    this.selectedSamples = event;
    this.identifierItems = this.allItems.filter(
      (item) => !this.selectedSamples.concat(this.selectedOthers).includes(item),
    );

    this.otherItems = this.allItems.filter(
      (item) => !this.selectedIdentifiers.concat(this.selectedSamples).includes(item),
    );

    this.onSelectionChange();
  }

  public onOtherSelectionChange(event): void {
    this.selectedOthers = event;
    this.identifierItems = this.allItems.filter(
      (item) => !this.selectedSamples.concat(this.selectedOthers).includes(item),
    );

    this.sampleItems = this.allItems.filter(
      (item) => !this.selectedIdentifiers.concat(this.selectedOthers).includes(item),
    );

    this.onSelectionChange();
  }

  private onSelectionChange(): void {
    this.updatePreviewStyles();
    this.checkIncludedColumnsUnique();
  }

  private checkIncludedColumnsUnique(): void {
    this.nonUniqueIncludedColumns.clear();

    const othersToInclude = this.includeOthers()
      ? this.selectedOthers
      : this.otherItems.filter((item) => !this.selectedOthers.includes(item));
    const allIncluded = this.selectedIdentifiers.concat(this.selectedSamples, othersToInclude);

    const names = new Set<string>();
    allIncluded
      .map((columnItem) => columnItem.name)
      .forEach((name) => {
        if (!names.has(name)) {
          names.add(name);
        } else {
          this.nonUniqueIncludedColumns.add(name);
        }
      });
  }

  private checkIdentifiersUnique(identifierColumns: ColumnItem[]): void {
    if (identifierColumns == null || identifierColumns.length < 1) {
      this.nonUniqueIdentifiers.clear();
      return;
    }

    this.nonUniqueIdentifiers.clear();
    const identifiers = new Set<string>();

    this.tsv2File
      .getBody()
      .map((tsvRow: Array<string>) => tsvRow[identifierColumns[0].index])
      .forEach((identifier) => {
        if (!identifiers.has(identifier)) {
          identifiers.add(identifier);
        } else {
          this.nonUniqueIdentifiers.add(identifier);
        }
      });
  }

  public getNonUniquesString(nonUniquesSet: Set<string>): string {
    if (nonUniquesSet.size < 1) {
      return "";
    }

    return Array.from(nonUniquesSet)
      .slice(0, 5)
      .reduce((all, identifier) => (all += identifier + " "), "")
      .slice(0, -1);
  }
  /**
   * Creates the observable that performs the wrangle operation,
   * closes the modal and returns the observable when closing the modal.
   *
   */
  public runWrangle(): void {
    // create the observable that does all the work
    const wrangle$ =
      // get the contents of the new file as a string
      defer(() => of(this.getWrangledFileString())).pipe(
        // create the new (derived) dataset
        mergeMap((wrangledFileString) => {
          log.info("Creating converted dataset");

          const newFileName =
            this.dataset.name.endsWith(".txt") || this.dataset.name.endsWith(".tsv")
              ? this.dataset.name.slice(0, -4) + "-converted.tsv"
              : this.dataset.name + "-converted.tsv";

          // phenodata
          const phenodataString = this.getPhenodataString();
          const metadataFiles = [
            {
              name: this.datasetService.PHENODATA_FILENAME,
              content: phenodataString,
            },
          ];

          return this.sessionDataService.createDerivedDataset(
            newFileName,
            [this.dataset],
            "Convert to Chipster format",
            wrangledFileString,
            "Import",
            metadataFiles,
          );
        }),
      );
    this.activeModal.close(wrangle$);
  }

  private getColumnIndexes(columnItems: ColumnItem[]): number[] {
    return columnItems.map((columnItem: ColumnItem) => columnItem.index).sort((a, b) => a - b); // sort them just in case selection order or something messes the order;
  }

  private getWrangledFileString(): string {
    const sampleColumnIndexes = this.getColumnIndexes(this.selectedSamples);
    const otherColumnIdexes = this.getColumnIndexes(this.selectedOthers); // these could be included or excluded
    const otherColumnsToIncludeIndexes = this.includeOthers()
      ? otherColumnIdexes
      : this.getColumnIndexes(this.allItems).filter(
          (item) =>
            !this.getColumnIndexes(this.selectedIdentifiers)
              .concat(sampleColumnIndexes, otherColumnIdexes)
              .includes(item),
        );

    // identifier not included here as it will be set as the first column
    // sort to retain the original order
    const columnsToIncludeIndexes = sampleColumnIndexes.concat(otherColumnsToIncludeIndexes).sort((a, b) => a - b);
    const newRows = this.tsv2File
      .getBody()
      .map((tsvRow: Array<string>) =>
        [tsvRow[this.selectedIdentifiers[0].index]].concat(
          columnsToIncludeIndexes.map((index: number) => tsvRow[index]),
        ),
      );

    const tsvHeaders = this.tsv2File.getHeadersForSpreadSheet();

    // careful, new headers are created here but not passed on
    // take note as phenodata is created using the originals
    const newHeaders = columnsToIncludeIndexes.map((index: number) => {
      const headerName = tsvHeaders[index];
      // add prefix for samples if missing
      if (sampleColumnIndexes.includes(index)) {
        return headerName.startsWith(this.SAMPLE_PREFIX) ? headerName : this.SAMPLE_PREFIX + headerName;
      }
      return headerName;
    });

    // arrays to strings
    const newHeadersString = d3.tsvFormatRows([newHeaders]);
    const newRowsString = d3.tsvFormatRows(newRows); // will escape for example tabs in values

    return newHeadersString + "\n" + newRowsString;
  }

  private getPhenodataString(): string {
    const phenodataHeaderString = "sample\toriginal_name\tchiptype\tgroup\tdescription\n";
    const tsvHeaders = this.tsv2File.getHeadersForSpreadSheet();

    const phenodataRowsString = this.getColumnIndexes(this.selectedSamples).reduce((phenodataRows: string, index) => {
      const sampleHeader = tsvHeaders[index]; // this is the original, could have chip.
      const fixedSampleHeader = sampleHeader.startsWith(this.SAMPLE_PREFIX)
        ? sampleHeader.substring(this.SAMPLE_PREFIX.length)
        : sampleHeader;
      return (
        phenodataRows +
        fixedSampleHeader +
        "\t" +
        this.dataset.name +
        "\t" +
        "not applicable" +
        "\t" +
        "" +
        "\t" +
        fixedSampleHeader +
        "\n"
      );
    }, "");

    return phenodataHeaderString + phenodataRowsString;
  }

  private includeOthers(): boolean {
    return this.includeExclude.value == this.INCLUDE;
  }

  private updatePreviewStyles(): void {
    this.agGrid.api.redrawRows(); // refreshCells() wasn't enough
  }
}
