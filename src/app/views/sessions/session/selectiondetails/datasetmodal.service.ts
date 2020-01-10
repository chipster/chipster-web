import { Injectable } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import * as d3 from 'd3';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { SessionData } from "../../../../model/session/session-data";
import TSVFile from '../../../../model/tsv/TSVFile';
import { FileResource } from '../../../../shared/resources/fileresource';
import { Tags, TypeTagService } from '../../../../shared/services/typetag.service';
import { SessionDataService } from '../session-data.service';
import { ImportToolComponent } from '../session-panel/import-tool/import-tool.component';
import { DatasetHistorymodalComponent } from "./datasethistorymodal/datasethistorymodal.component";

@Injectable()
export class DatasetModalService {
  constructor(private ngbModal: NgbModal,
    private sessionDataService: SessionDataService,
    private typeTagService: TypeTagService,
    private fileResource: FileResource) { }

  private unsubscribe: Subject<any> = new Subject();
  private fileSizeLimit = 1024;
  private modalFileSizeLimit = 1024;
  private maxRowsimit = 100;
  public lineCount: number;
  private maxCellsLimit = 10 * 1000;
  private totalRowCount: number;
  private modalMode = true;
  private headers: string[];
  private content: string[][];

  openDatasetHistoryModal(dataset: Dataset, sessionData: SessionData): void {
    const modalRef = this.ngbModal.open(DatasetHistorymodalComponent, {
      size: "lg"
    });
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.sessionData = sessionData;
  }

  openImportToolModal(dataset: Dataset, sessionData: SessionData): void {
    // load data
    const modalMode = true;
    const maxBytes = modalMode ? this.modalFileSizeLimit : this.fileSizeLimit;
    this.fileResource
      .getData(this.sessionDataService.getSessionId(), dataset, maxBytes)
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
            sessionData,
            dataset,
            Tags.SKIP_LINES
          );

          if (skipLines) {
            parsedTSV = parsedTSV.filter(row => !row[0].startsWith(skipLines));
          }

          this.lineCount = parsedTSV.length;

          // type-service gives the column titles for some file types
          const typeTitles = this.typeTagService.get(
            sessionData,
            dataset,
            Tags.COLUMN_TITLES
          );

          if (typeTitles) {
            // create a new first row from the column titles
            parsedTSV.unshift(typeTitles.split("\t"));
          }

          const normalizedTSV = new TSVFile(
            parsedTSV,
            dataset.datasetId,
            "file"
          );

          // whether the data contains a header row or not
          if (
            this.typeTagService.has(
              sessionData,
              dataset,
              Tags.NO_TITLE_ROW
            )
          ) {
            if (normalizedTSV.getRawData().length > 0) {
              this.headers = new Array<string>(normalizedTSV.getRawData()[0].length);
            } else {
              this.headers = [];
            }
            this.content = normalizedTSV.getRawData();
          } else {
            this.headers = normalizedTSV.getRawData()[0];
            this.content = normalizedTSV.getRawData().slice(1);
          }
          // call the modal after data is ready
          const modalRef = this.ngbModal.open(ImportToolComponent, {
            size: "lg",
            windowClass: "modal-xl"
          });
          modalRef.componentInstance.headers = this.headers;
          modalRef.componentInstance.content = this.content;
          modalRef.componentInstance.dataset = dataset;
        },
        (error: Response) => {
          // handle error
        }
      );


  }
}
