import FileResource from "../resources/fileresource";
import {Observable} from "rxjs/Rx";
import {Injectable, Inject} from "@angular/core";

@Injectable()
export class CSVReader {

    constructor(
        @Inject('FileResource') private FileResource: FileResource) {
    }

   getColumns(sessionId: string, datasetId: string): Observable<any> {
        return Observable.fromPromise(this.FileResource.getData(sessionId, datasetId));
   }

}
