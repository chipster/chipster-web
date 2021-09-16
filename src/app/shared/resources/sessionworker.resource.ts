import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of, never } from "rxjs";
import { map, mergeMap, tap, catchError } from "rxjs/operators";
import { TokenService } from "../../core/authentication/token.service";
import { ConfigService } from "../services/config.service";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";

@Injectable()
export class SessionWorkerResource {
  public service: any;

  constructor(
    private tokenService: TokenService,
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private http: HttpClient
  ) {}

  getPackageUrl(sessionId: string): Observable<string> {
    const apiUrl$ = this.configService.getSessionWorkerUrl();
    return apiUrl$.pipe(map((url: string) => `${url}/sessions/${sessionId}`));
  }

  extractSession(sessionId: string, zipDatasetId: string): Observable<any> {
    const apiUrl$ = this.configService.getSessionWorkerUrl();
    return apiUrl$.pipe(
      mergeMap((url: string) =>
        this.http.post(
          `${url}/sessions/${sessionId}/datasets/${zipDatasetId}`,
          {},
          this.tokenService.getTokenParams(true)
        )
      ),
      tap((x) => console.log("extractSession()", x)),
      catchError((e) => {
        this.restErrorService.showError("extract session failed", e);
        throw never();
      })
    );
  }

  supportRequest(message: string, sessionId: string, email: string, appId: string, log: string): Observable<any> {
    const supportRequest = {
      mail: email,
      message: message,
      session: sessionId,
      app: appId,
      log: log,
    };

    const apiUrl$ = this.configService.getSessionWorkerUrl();
    return apiUrl$.pipe(
      mergeMap((url: string) =>
        this.http.post(url + "/support/request", supportRequest, this.tokenService.getTokenParams(true))
      )
    );
  }
}
