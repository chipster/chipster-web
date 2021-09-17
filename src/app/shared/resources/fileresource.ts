import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { Observable, of as observableOf } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { TokenService } from "../../core/authentication/token.service";
import { ConfigService } from "../services/config.service";

@Injectable()
export class FileResource {
  constructor(private configService: ConfigService, private http: HttpClient, private tokenService: TokenService) {}

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

    if (isReqArrayBuffer) {
      // For Bam Viewer, we need array buffer as reponse
      return apiUrl$.pipe(
        mergeMap((url: string) =>
          this.http.get(`${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`, {
            headers: this.tokenService.getTokenHeader(),
            withCredentials: true,
            responseType: "arraybuffer",
          })
        )
      );
    } 
      return apiUrl$.pipe(
        mergeMap((url: string) =>
          this.http.get(`${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`, {
            headers: this.tokenService.getTokenHeader(),
            withCredentials: true,
            responseType: "text",
          })
        )
      );
    
  }

  getLimitedData(sessionId: string, dataset: Dataset, maxBytes: number, isReqArrayBuffer?: boolean): Observable<any> {
    if (maxBytes) {
      maxBytes = Math.min(maxBytes, dataset.size);

      if (maxBytes === 0) {
        // 0-0 range would produce 416 - Requested range not satisfiable
        return observableOf("");
      }
    }

    const apiUrl$ = this.configService.getFileBrokerUrl();
    let headers = this.tokenService.getTokenHeader();
    if (maxBytes) {
      headers = headers.set("range", `bytes=0-${maxBytes}`);
    }

    if (isReqArrayBuffer) {
      return apiUrl$.pipe(
        mergeMap((url: string) =>
          this.http.get(`${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`, {
            headers,
            withCredentials: true,
            responseType: "arraybuffer",
            reportProgress: true,
          })
        )
      );
    } 
      return apiUrl$.pipe(
        mergeMap((url: string) =>
          this.http.get(`${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`, {
            headers,
            withCredentials: true,
            responseType: "text",
            reportProgress: true,
          })
        )
      );
    
  }

  uploadData(sessionId: string, datasetId: string, data: string): Observable<any> {
    const apiUrl$ = this.configService.getFileBrokerUrl();
    return apiUrl$.pipe(
      mergeMap((url: string) =>
        this.http.put(
          `${url}/sessions/${sessionId}/datasets/${datasetId}`,
          data,
          this.tokenService.getTokenParams(true)
        )
      )
    );
  }
}
