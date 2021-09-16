import { Injectable } from "@angular/core";
import { Dataset } from "chipster-js-common";
import * as d3 from "d3";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { SessionData } from "../../model/session/session-data";
import TSV2File from "../../model/tsv/TSV2File";
import TSVFile from "../../model/tsv/TSVFile";
import "../../rxjs-operators";
import { SelectionOption } from "../../views/sessions/session/tool.selection.service";
import { FileResource } from "../resources/fileresource";
import { TypeTagService } from "./typetag.service";

const MAX_HEADER_LENGTH = 64 * 1024;

@Injectable()
export class TsvService {
  constructor(private fileResource: FileResource, private typeTagService: TypeTagService) {}

  getTSV(sessionId: string, dataset: Dataset): Observable<any> {
    return this.fileResource.getData(sessionId, dataset);
  }

  getTSVFile(sessionId: string, dataset: Dataset, maxBytes?: number): Observable<TSVFile> {
    return this.fileResource.getLimitedData(sessionId, dataset, maxBytes).pipe(
      map((tsvData: any) => {
        const parsedTSVData = d3.tsvParseRows(tsvData);
        return new TSVFile(parsedTSVData, dataset.datasetId, "dataset");
      })
    );
  }

  getTSV2File(dataset: Dataset, sessionData: SessionData, maxBytes?: number): Observable<TSV2File> {
    return this.fileResource.getLimitedData(sessionData.session.sessionId, dataset, maxBytes).pipe(
      map((tsvData: any) => {
        const tsvArray = d3.tsvParseRows(tsvData);
        return this.getTSV2FileFromArray(dataset, sessionData, tsvArray);
      })
    );
  }

  getTSV2FileFromArray(dataset: Dataset, sessionData: SessionData, tsvArray: Array<Array<string>>): TSV2File {
    return TSV2File.create(tsvArray, dataset, sessionData, this.typeTagService);
  }

  getTSV2FileHeaders(dataset: Dataset, sessionData: SessionData): Observable<Array<SelectionOption>> {
    return this.getTSV2File(dataset, sessionData, MAX_HEADER_LENGTH).pipe(
      map((tsv2File: TSV2File) => tsv2File.getHeadersForParameter())
    );
  }

  getTSVFileHeaders(sessionId: string, dataset: Dataset): Observable<Array<string>> {
    return this.getTSVFile(sessionId, dataset, MAX_HEADER_LENGTH).pipe(
      map((tsvFile: TSVFile) => tsvFile.headers.headers)
    );
  }

  getTSVHeaders(tsv: string): string[] {
    const parsedTSV: string[][] = d3.tsvParseRows(tsv);
    return parsedTSV != null && parsedTSV.length > 0 ? parsedTSV[0] : [];
  }

  getTSV2FileHeadersForParameter(sessionId: string, dataset: Dataset): Observable<Array<string>> {
    return this.getTSVFile(sessionId, dataset, MAX_HEADER_LENGTH).pipe(
      map((tsvFile: TSVFile) => tsvFile.headers.headers)
    );
  }
}
