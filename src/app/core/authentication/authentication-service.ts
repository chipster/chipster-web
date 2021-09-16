import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { User } from "chipster-js-common";
import log from "loglevel";
import { Observable, of as observableOf } from "rxjs";
import { catchError, map, mergeMap, publishReplay, refCount, tap } from "rxjs/operators";
import { AuthHttpClientService } from "../../shared/services/auth-http-client.service";
import { ConfigService } from "../../shared/services/config.service";
import { RestErrorService } from "../errorhandler/rest-error.service";
import { TokenService } from "./token.service";

const TOKEN_REFRESH_INTERVAL = 1000 * 60 * 60; // ms

@Injectable()
export class AuthenticationService {
  private tokenRefreshSchedulerId: number;

  private user$: Observable<User>;

  constructor(
    private configService: ConfigService,
    private tokenService: TokenService,
    private httpClient: HttpClient,
    private authHttpClient: AuthHttpClientService,
    private restErrorService: RestErrorService
  ) {
    this.init();
  }

  init() {
    let token = this.tokenService.getToken();
    if (token != null && !token.includes(".")) {
      // probably old UUID token, clear everything from local storage
      log.info("found a token from the local storage, but it's not a JWS token. Clearing local storage...");
      localStorage.clear();
      token = null;
    }
    this.saveToken(token);

    this.user$ = this.getUser().pipe(publishReplay(1), refCount());
  }

  // Do the authentication here based on userid and password
  login(username: string, password: string): Observable<any> {
    // clear any old tokens
    this.tokenService.setAuthToken(null);
    return this.requestToken(username, password).pipe(
      map((token: string) => {
        this.saveToken(token);
      })
    );
  }

  logout(): void {
    this.stopTokenRefresh();
    this.tokenService.clear();
  }

  requestToken(username: string, password: string): Observable<string> {
    log.info("request token");
    return this.configService.getAuthUrl().pipe(
      tap((url) => log.info("url", url)),
      mergeMap((authUrl) => {
        const url = `${authUrl}/tokens`;

        return this.httpClient.post(
          url,
          {},
          {
            headers: this.tokenService.getHttpBasicHeader(username, password),
            responseType: "text",
          }
        );
      })
    );
  }

  refreshToken() {
    if (!this.tokenService.getToken()) {
      log.info("no token to refresh");
      return;
    }

    this.configService
      .getAuthUrl()
      .pipe(
        mergeMap((authUrl) => {
          const url = `${authUrl}/tokens/refresh`;

          return this.httpClient.post(
            url,
            {},
            {
              headers: this.tokenService.getTokenHeader(),
              responseType: "text",
            }
          );
        })
      )
      .subscribe(
        (response: string) => {
          this.tokenService.setAuthToken(response);
        },
        (error: any) => {
          if (error.status === 403) {
            log.info("got forbidden when trying to refresh token, stopping periodic token refresh");
            this.stopTokenRefresh();
          } else {
            log.info("refresh token failed", error.status, error.statusText);
          }
        }
      );
  }

  checkToken(): Observable<boolean> {
    if (!this.tokenService.getToken()) {
      log.warn("no token to check");
      return observableOf(false);
    }

    return this.configService.getAuthUrl().pipe(
      mergeMap((authUrl) => {
        const url = `${authUrl}/tokens/check`;

        return this.httpClient.get<any>(url, this.tokenService.getTokenParams(false)).pipe(
          map((response: any) => {
            log.info("token is valid");
            return true;
          }),
          catchError((error) => {
            if (error.status === 403) {
              // token is invalid
              log.info("check token got 403 -> token invalid");
              return observableOf(false);
            } else {
              // for now, throw others
              throw error;
            }
          })
        );
      })
    );
  }

  scheduleTokenRefresh() {
    this.tokenRefreshSchedulerId = window.setInterval(this.refreshToken.bind(this), TOKEN_REFRESH_INTERVAL);
  }

  stopTokenRefresh() {
    if (this.tokenRefreshSchedulerId != null) {
      window.clearInterval(this.tokenRefreshSchedulerId);
    }
  }

  getUser(): Observable<User> {
    return this.configService.getAuthUrl().pipe(
      mergeMap((authUrl) => {
        const userId = encodeURIComponent(this.tokenService.getUsername());
        const url = `${authUrl}/users/${userId}`;

        return <Observable<User>>this.authHttpClient.getAuth(url);
      })
    );
  }

  getUsers(): Observable<User[]> {
    return this.configService.getAuthUrl().pipe(
      mergeMap((authUrl) => {
        const url = `${authUrl}/users`;

        return <Observable<User[]>>this.authHttpClient.getAuth(url);
      }),
      catchError((err) => {
        this.restErrorService.showError("failed to get users", err);
        throw err;
      })
    );
  }

  updateUser(user: User): Observable<any> {
    return this.configService.getAuthUrl().pipe(
      mergeMap((authUrl) => {
        const userId = encodeURIComponent(this.tokenService.getUsername());
        const url = `${authUrl}/users/${userId}`;
        return <Observable<User>>this.authHttpClient.putAuth(url, user);
      })
    );
  }

  saveToken(token: string) {
    this.tokenService.setAuthToken(token);
    this.stopTokenRefresh();

    if (token != null) {
      this.scheduleTokenRefresh();
    }
  }
}
