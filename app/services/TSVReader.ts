import FileResource from "../resources/fileresource";
import {Injectable, Inject} from "@angular/core";
import {Observable} from "rxjs/Rx";

@Injectable()
export class TSVReader {

   constructor(@Inject('FileResource') private FileResource: FileResource) {
    }

    getTSV(sessionId: string, datasetId: string): Observable<any> {
        return Observable.fromPromise(this.FileResource.getData(sessionId, datasetId));
    }

}