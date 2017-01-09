import FileResource from "../../resources/fileresource";
import {Injectable, Inject} from "@angular/core";
import {Observable} from "rxjs/Rx";
import '../../rxjs-operators';
import TSVFile from "../../model/tsv/TSVFile";
import * as d3 from "d3";

@Injectable()
export class TSVReader {

   constructor(@Inject('FileResource') private FileResource: FileResource) {
    }

    getTSV(sessionId: string, datasetId: string): Observable<any> {
        return Observable.fromPromise(this.FileResource.getData(sessionId, datasetId));
    }

    getTSVFile(sessionId: string, datasetId: string): Observable<TSVFile> {
        return this.getTSV(sessionId, datasetId).map( (tsvData: any) => {
            let parsedTSVData = d3.tsvParseRows(tsvData.data);
            return new TSVFile(parsedTSVData, datasetId, 'dataset');
        });
    }

}
