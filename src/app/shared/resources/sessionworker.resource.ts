import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { TokenService } from "../../core/authentication/token.service";
import { ConfigService } from "../services/config.service";

@Injectable()
export class SessionWorkerResource {
  public service: any;

  constructor(
    private tokenService: TokenService,
    private configService: ConfigService,
    private http: HttpClient
  ) {}

  getPackageUrl(sessionId: string): Observable<string> {
    const apiUrl$ = this.configService.getSessionWorkerUrl();
    return apiUrl$.pipe(
      map(
        (url: string) =>
          `${url}/sessions/${sessionId}?token=${this.tokenService.getToken()}`
      )
    );
  }

  extractSession(sessionId: string, zipDatasetId: string): Observable<any> {
    const apiUrl$ = this.configService.getSessionWorkerUrl();
    const headers = new HttpHeaders({
      Authorization: this.tokenService.getTokenHeader().Authorization
    });
    return apiUrl$.pipe(
      mergeMap((url: string) =>
        this.http.post(
          `${url}/sessions/${sessionId}/datasets/${zipDatasetId}`,
          {},
          { headers: headers, withCredentials: true }
        )
      )
    );
  }

  supportRequest(
    message: string,
    sessionId: string,
    email: string,
    appId: string,
    log: string
  ): Observable<any> {
    const supportRequest = {
      mail: email,
      message: message,
      session: sessionId,
      app: appId,
      log: log
    };

    const apiUrl$ = this.configService.getSessionWorkerUrl();
    const headers = new HttpHeaders({
      Authorization: this.tokenService.getTokenHeader().Authorization
    });
    return apiUrl$.pipe(
      mergeMap((url: string) =>
        this.http.post(url + "/support/request", supportRequest, {
          headers: headers,
          withCredentials: true
        })
      )
    );
  }
}
