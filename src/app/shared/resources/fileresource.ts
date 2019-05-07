
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { Observable, of as observableOf } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { TokenService } from "../../core/authentication/token.service";
import { ConfigService } from "../services/config.service";


@Injectable()
export class FileResource {
  constructor(
    private configService: ConfigService,
    private http: HttpClient,
    private tokenService: TokenService
  ) { }

  /**
   *
   * @param sessionId
   * @param dataset
   * @param maxBytes -1 for full file
   * @param isReqArrayBuffer
   * @returns {any}
   */
  getData(
    sessionId: string,
    dataset: Dataset,
    maxBytes?: number,
    isReqArrayBuffer?: boolean
  ): Observable<any> {
    if (maxBytes) {
      return this.getLimitedData(
        sessionId,
        dataset,
        maxBytes,
        isReqArrayBuffer
      );
    }

    const apiUrl$ = this.configService.getFileBrokerUrl();
    const headers = new HttpHeaders({
      'Authorization': this.tokenService.getTokenHeader().Authorization
    });
    if (isReqArrayBuffer) {
      // For Bam Viewer, we need array buffer as reponse
      return apiUrl$.pipe(mergeMap((url: string) =>
        this.http.get(
          `${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`,
          { headers: headers, withCredentials: true, responseType: 'arraybuffer' }
        )
      ));
    } else {
      return apiUrl$.pipe(mergeMap((url: string) =>
        this.http.get(
          `${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`,
          { headers: headers, withCredentials: true, responseType: 'text' }
        )
      ));
    }
  }

  getLimitedData(
    sessionId: string,
    dataset: Dataset,
    maxBytes: number,
    isReqArrayBuffer?: boolean
  ): Observable<any> {
    if (maxBytes) {
      maxBytes = Math.min(maxBytes, dataset.size);

      if (maxBytes === 0) {
        // 0-0 range would produce 416 - Requested range not satisfiable
        return observableOf("");
      }
    }

    const apiUrl$ = this.configService.getFileBrokerUrl();
    const rangeHeader = new HttpHeaders({
      'Authorization': this.tokenService.getTokenHeader().Authorization,
      'range': `bytes=0-${maxBytes}`
    });
    if (isReqArrayBuffer) {
      return apiUrl$.pipe(mergeMap((url: string) =>
        this.http.get(
          `${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`, {
            headers: rangeHeader, withCredentials: true,
            responseType: "arraybuffer", reportProgress: true
          })

      ));
    } else {
      return apiUrl$.pipe(mergeMap((url: string) =>
        this.http.get(
          `${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`, {
            headers: rangeHeader, withCredentials: true,
            responseType: "text", reportProgress: true
          })
      ));
    }
  }


  uploadData(sessionId: string, datasetId: string, data: string): Observable<any> {
    const apiUrl$ = this.configService.getFileBrokerUrl();
    const headers = new HttpHeaders({
      'Authorization': this.tokenService.getTokenHeader().Authorization
    });
    return apiUrl$.pipe(mergeMap((url: string) =>
      this.http.put(
        `${url}/sessions/${sessionId}/datasets/${datasetId}`, {
          observe: data, headers: headers, withCredentials: true,
          reportProgress: true,
        }
      )
    ));
  }
}
