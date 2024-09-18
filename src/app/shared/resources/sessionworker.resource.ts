import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { forkJoin, never, Observable } from "rxjs";
import { catchError, mergeMap, tap } from "rxjs/operators";
import { TokenService } from "../../core/authentication/token.service";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { ConfigService } from "../services/config.service";
import { SessionResource } from "./session.resource";

@Injectable()
export class SessionWorkerResource {
  public service: any;

  constructor(
    private tokenService: TokenService,
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private sessionResource: SessionResource,
    private http: HttpClient,
  ) {}

  packageSession(sessionId: string): Observable<any> {
    return forkJoin({
      /**
       * Get read-write token for the session
       *
       * Now we can send the token in http header, so we could use the auth token as well. But we happened
       * to have this code for getting a session token, so let's use it and maybe we should use them more
       * widely in the future to minimize access rights.
       */
      token: this.sessionResource.getTokenForSession(sessionId, true),
      url: this.configService.getSessionWorkerUrl(),
    }).pipe(
      mergeMap((res) =>
        this.http.post(`${res.url}/sessions/${sessionId}`, {}, this.tokenService.getTokenParamsWithToken(res.token)),
      ),
      catchError((e) => {
        this.restErrorService.showError("package session failed", e);
        throw never();
      }),
    );
  }

  extractSession(sessionId: string, zipDatasetId: string): Observable<any> {
    const apiUrl$ = this.configService.getSessionWorkerUrl();
    return apiUrl$.pipe(
      mergeMap((url: string) =>
        this.http.post(
          `${url}/sessions/${sessionId}/datasets/${zipDatasetId}`,
          {},
          this.tokenService.getTokenParams(true),
        ),
      ),
      tap((x) => console.log("extractSession()", x)),
      catchError((e) => {
        this.restErrorService.showError("extract session failed", e);
        throw never();
      }),
    );
  }

  supportRequest(message: string, sessionId: string, email: string, appId: string, log: string): Observable<any> {
    const supportRequest = {
      mail: email,
      message,
      session: sessionId,
      app: appId,
      log,
    };

    const apiUrl$ = this.configService.getSessionWorkerUrl();
    return apiUrl$.pipe(
      mergeMap((url: string) =>
        this.http.post(url + "/support/request", supportRequest, this.tokenService.getTokenParams(true)),
      ),
    );
  }
}
