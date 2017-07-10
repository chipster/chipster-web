import {ConfigService} from "../services/config.service";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {RestService} from "../../core/rest-services/restservice/rest.service";
import {ResponseContentType, Headers} from "@angular/http";

@Injectable()
export class FileResource {

  constructor(private configService: ConfigService,
              private restService: RestService) {
  }

  /**
   *
   * @param sessionId
   * @param datasetId
   * @param maxBytes -1 for full file
   * @param isReqArrayBuffer is required response as an array buffer instead of text, false for normal text response
   * @returns {any}
   */
  getData(sessionId: string, datasetId: string, maxBytes?: number, isReqArrayBuffer?: boolean): Observable<any> {
    if (maxBytes && maxBytes > -1) {
      return this.getLimitedData(sessionId, datasetId, maxBytes, isReqArrayBuffer);
    }

    const apiUrl$ = this.configService.getFileBrokerUrl();
    if (isReqArrayBuffer) {
      return apiUrl$.flatMap((url: string) => this.restService.get(`${url}/sessions/${sessionId}/datasets/${datasetId}`, true, {responseType: ResponseContentType.ArrayBuffer}));
    } else {
      return apiUrl$.flatMap((url: string) => this.restService.get(`${url}/sessions/${sessionId}/datasets/${datasetId}`, true, {responseType: ResponseContentType.Text}));
    }

  }

  getLimitedData(sessionId: string, datasetId: string, maxBytes: number, isReqArrayBuffer?: boolean): Observable<any> {
    const apiUrl$ = this.configService.getFileBrokerUrl();
    if (isReqArrayBuffer) {
      return apiUrl$.flatMap((url: string) => this.restService.get(`${url}/sessions/${sessionId}/datasets/${datasetId}`, true, {
        headers: new Headers({range: `bytes=0-${maxBytes}`}),
        responseType: ResponseContentType.ArrayBuffer
      }));
    } else {
      return apiUrl$.flatMap((url: string) => this.restService.get(`${url}/sessions/${sessionId}/datasets/${datasetId}`, true, {
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
