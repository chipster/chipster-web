import FileResource from "../resources/fileresource";
import {Observable} from "rxjs/Rx";

export default class CSVReader {

    static $inject = ['FileResource'];

    constructor(
        private FileResource: FileResource) {
    }

   getColumns(sessionId: string, datasetId: string): Observable<any> {
        return Observable.fromPromise(this.FileResource.getData(sessionId, datasetId));
   }

}