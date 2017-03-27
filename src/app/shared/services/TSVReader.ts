import {FileResource} from "../resources/fileresource";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Rx";
import '../../rxjs-operators';
import TSVFile from "../../model/tsv/TSVFile";
import * as d3 from "d3";

@Injectable()
export class TSVReader {

   constructor(private fileResource: FileResource) {
    }

    getTSV(sessionId: string, datasetId: string): Observable<any> {
        return this.fileResource.getData(sessionId, datasetId);
    }

    getTSVFile(sessionId: string, datasetId: string): Observable<TSVFile> {
        return this.fileResource.getData(sessionId, datasetId).map( (tsvData: any) => {
            let parsedTSVData = d3.tsvParseRows(tsvData);
            return new TSVFile(parsedTSVData, datasetId, 'dataset');
        });
    }

}
