import {FileResource} from "../resources/fileresource";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Rx";
import '../../rxjs-operators';
import TSVFile from "../../model/tsv/TSVFile";
import * as d3 from "d3";
import Dataset from "chipster-js-common";

const MAX_HEADER_LENGTH = 64 * 1024;

@Injectable()
export class TSVReader {

   constructor(private fileResource: FileResource) {
    }

    getTSV(sessionId: string, dataset: Dataset): Observable<any> {
        return this.fileResource.getData(sessionId, dataset);
    }

    getTSVFile(sessionId: string, dataset: Dataset, maxBytes?: number): Observable<TSVFile> {
        return this.fileResource.getLimitedData(sessionId, dataset, maxBytes).map( (tsvData: any) => {
            let parsedTSVData = d3.tsvParseRows(tsvData);
            return new TSVFile(parsedTSVData, dataset.datasetId, 'dataset');
        });
    }

  getTSVFileHeaders(sessionId: string, dataset: Dataset): Observable<Array<string>> {
    return this.getTSVFile(sessionId, dataset, MAX_HEADER_LENGTH)
      .map((tsvFile: TSVFile) => tsvFile.headers.headers);
  }
}
