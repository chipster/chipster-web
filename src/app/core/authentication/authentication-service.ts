
import { of as observableOf, Observable, BehaviorSubject } from 'rxjs';

import { catchError, map, mergeMap, tap, publishReplay, refCount } from 'rxjs/operators';
import { ConfigService } from "../../shared/services/config.service";
import { Injectable } from "@angular/core";
import { TokenService } from "./token.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Token } from "chipster-js-common";
import { AuthHttpClientService } from "../../shared/services/auth-http-client.service";
import { RestErrorService } from "../errorhandler/rest-error.service";
import { User } from "chipster-js-common";
import log from "loglevel";

const TOKEN_REFRESH_INTERVAL = 1000 * 60 * 60; // ms

@Injectable()
export class AuthenticationService {
  private tokenRefreshSchedulerId: number;

  private user$: BehaviorSubject<any>;

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
    // Need to check after code change
    this.user$ = this.configService
      .getAuthUrl().pipe(
        tap(x => log.debug("auth url", x)),
        mergeMap(authUrl => {
          const userId = encodeURIComponent(this.tokenService.getUsername());
          const url = `${authUrl}/users/${userId}`;

          return <Observable<User>>this.authHttpClient.getAuth(url);
        }),
        tap(x => log.debug("user", x)),
        publishReplay(1),
        refCount());
  }

  // Do the authentication here based on userid and password
  login(username: string, password: string): Observable<any> {
    // clear any old tokens
    this.tokenService.setAuthToken(null, null, null, null, null);
    return this.requestToken(username, password).pipe(map((response: Token) => {
      this.saveToken(response);
      this.scheduleTokenRefresh();
    }));
  }

  logout(): void {
    this.stopTokenRefresh();
    this.tokenService.clear();
  }

  requestToken(username: string, password: string): Observable<any> {
    log.info("request token");
    return this.configService
      .getAuthUrl().pipe(
        tap(url => log.info("url", url)),
        mergeMap(authUrl => {
          const url = `${authUrl}/tokens`;
          const encodedString = btoa(`${username}:${password}`); // base64 encoding

          return this.httpClient.post<Token>(
            url,
            {},
            {
              headers: new HttpHeaders().set(
                "Authorization",
                `Basic ${encodedString}`
              )
            }
          );
        }));
  }

  refreshToken() {
    if (!this.tokenService.getToken()) {
      log.info("no token to refresh");
      return;
    }
    log.info("refreshing token", this.tokenService.getToken(), new Date());

    this.configService
      .getAuthUrl()
      .flatMap(authUrl => {
        const url = `${authUrl}/tokens/refresh`;
        const encodedString = btoa(`token:${this.tokenService.getToken()}`); // base64 encoding

        return this.httpClient.post<Token>(
          url,
          {},
          {
            headers: new HttpHeaders().set(
              "Authorization",
              `Basic ${encodedString}`
            )
          }
        );
      })
      .subscribe(
        (response: Token) => {
          const roles = JSON.parse(response.rolesJson);
          this.tokenService.setAuthToken(
            response.tokenKey,
            response.username,
            response.name,
            response.validUntil,
            roles
          );
        },
        (error: any) => {
          if (error.status === 403) {
            log.info(
              "got forbidden when trying to refresh token, stopping periodic token refresh"
            );
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

    return this.configService.getAuthUrl().flatMap(authUrl => {
      const url = `${authUrl}/tokens/check`;
      const encodedString = btoa(`token:${this.tokenService.getToken()}`); // base64 encoding

      return this.httpClient
        .post<Token>(
          url,
          {},
          {
            headers: new HttpHeaders().set(
              "Authorization",
              `Basic ${encodedString}`
            )
          }
        ).pipe(
          map((response: Token) => {
            this.saveToken(response);
            return observableOf(true);
          }),
          catchError(error => {
            if (error.status === 403) {
              // token is invalid
              log.info("check token got 403 -> token invalid");
              return observableOf(false);
            } else {
              // for now, throw others
              throw error;
            }
          }));
    });
  }

  scheduleTokenRefresh() {
    this.tokenRefreshSchedulerId = window.setInterval(
      this.refreshToken.bind(this),
      TOKEN_REFRESH_INTERVAL
    );
  }

  stopTokenRefresh() {
    window.clearInterval(this.tokenRefreshSchedulerId);
  }

  // Not very sure, is it the right way..
  getUser(): Observable<User> {
    this.user$ = this.configService.getAuthUrl().flatMap(authUrl => {
      const userId = encodeURIComponent(this.tokenService.getUsername());
      const url = `${authUrl}/users/${userId}`;

      return <Observable<User>>this.authHttpClient.getAuth(url);
    });
    return this.user$;
  }

  getUsersDisplayName$() {
    return this.tokenService
      .getUsername$().pipe(
        mergeMap(userId => {
          return this.getUser().pipe(catchError(err => {
            log.info("failed to get the user details", err);
            // An error message from this request would be confusing, because the user didn't ask for it.
            // Most likely the authentication has expired, but the user will notice it soon anyway.
            return observableOf({ name: userId });
          }));
        }),
        map(user => user.name));
  }

  getUsers(): Observable<User[]> {
    return this.configService
      .getAuthUrl()
      .flatMap(authUrl => {
        const url = `${authUrl}/users`;

        return <Observable<User[]>>this.authHttpClient.getAuth(url);
      })
      .catch(err => {
        this.restErrorService.showError("failed to get users", err);
        throw err;
      });
  }

  updateUser(user: User): Observable<any> {
    return this.configService.getAuthUrl().flatMap(authUrl => {
      const userId = encodeURIComponent(this.tokenService.getUsername());
      const url = `${authUrl}/users/${userId}`;

      return <Observable<User>>this.authHttpClient.putAuth(url, user);
    });
  }

  private saveToken(token: Token) {
    const roles = JSON.parse(token.rolesJson);
    this.tokenService.setAuthToken(
      token.tokenKey,
      token.username,
      token.name,
      token.validUntil,
      roles
    );
  }
}
