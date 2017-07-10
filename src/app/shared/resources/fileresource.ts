import {ConfigService} from "../services/config.service";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {RestService} from "../../core/rest-services/restservice/rest.service";
import {ResponseContentType, Headers} from "@angular/http";
import Dataset from "../../model/session/dataset";

@Injectable()
export class FileResource {

  constructor(private configService: ConfigService,
              private restService: RestService) {
  }

  /**
   *
   * @param sessionId
   * @param dataset
   * @param maxBytes -1 for full file
   * @param isReqArrayBuffer
   * @returns {any}
   */
  getData(sessionId: string, dataset: Dataset, maxBytes?: number, isReqArrayBuffer?: boolean): Observable<any> {

    if (maxBytes) {
      return this.getLimitedData(sessionId, dataset, maxBytes, isReqArrayBuffer);
    }

    const apiUrl$ = this.configService.getFileBrokerUrl();
    if (isReqArrayBuffer) {//For Bam Viewer, we need array buffer as reponse
      return apiUrl$.flatMap((url: string) => this.restService.get(`${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`, true, {responseType: ResponseContentType.ArrayBuffer}));
    } else {
      return apiUrl$.flatMap((url: string) => this.restService.get(`${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`, true, {responseType: ResponseContentType.Text}));
    }

  }

  getLimitedData(sessionId: string, dataset: Dataset, maxBytes: number, isReqArrayBuffer?: boolean): Observable<any> {

    if (maxBytes) {
      maxBytes = Math.min(maxBytes, dataset.size);

      if (maxBytes === 0) {
        // 0-0 range would produce 416 - Requested range not satisfiable
        return Observable.of('');
      }
    }

    const apiUrl$ = this.configService.getFileBrokerUrl();
    if (isReqArrayBuffer) {
      return apiUrl$.flatMap((url: string) => this.restService.get(`${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`, true, {
        headers: new Headers({range: `bytes=0-${maxBytes}`}),
        responseType: ResponseContentType.ArrayBuffer
      }));
    } else {
      return apiUrl$.flatMap((url: string) => this.restService.get(`${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`, true, {
        headers: new Headers({range: `bytes=0-${maxBytes}`}),
        responseType: ResponseContentType.Text
      }));
    }

  }

  uploadData(sessionId: string, datasetId: string, data: string): Observable<any> {
    const apiUrl$ = this.configService.getFileBrokerUrl();
    return apiUrl$
      .flatMap((url: string) => this.restService.put(`${url}/sessions/${sessionId}/datasets/${datasetId}`, data, true, {}, false));
  }
}
