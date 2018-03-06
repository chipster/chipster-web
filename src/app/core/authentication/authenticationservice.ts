import {ConfigService} from "../../shared/services/config.service";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {CoreServices} from "../core-services";
import {TokenService} from "./token.service";
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {TokenResponse} from "./token.response";
import { AuthHttpClientService } from "../../shared/services/auth-http-client.service";
import { RestErrorService } from "../errorhandler/rest-error.service";
import { User } from "../../model/user";

const TOKEN_REFRESH_INTERVAL = 1000*60*60; // ms

@Injectable()
export class AuthenticationService {

  private tokenRefreshSchedulerId: number;

  constructor(private ConfigService: ConfigService,
              private tokenService: TokenService,
              private httpClient: HttpClient,
              private authHttpClient: AuthHttpClientService,
              private restErrorService: RestErrorService) {
  }

  // Do the authentication here based on userid and password
  login(username: string, password: string): Observable<any> {
    // clear any old tokens
    this.tokenService.setAuthToken(null, null, null, null);
    return this.requestToken(username, password).map((response: any) => {
      let roles = JSON.parse(response.rolesJson);
      this.tokenService.setAuthToken(response.tokenKey, response.username, response.validUntil, roles);
      this.scheduleTokenRefresh();
    });
  };

  logout(): void {
    this.stopTokenRefresh();
    this.tokenService.clear();
  };

  requestToken(username: string, password: string): Observable<any> {
    console.log("request token");
    return this.ConfigService.getConfiguration().flatMap((coreServices: CoreServices) => {
      const url = `${coreServices.auth}/tokens`;
      const encodedString = btoa(`${username}:${password}`); // base64 encoding

      return this.httpClient.post<TokenResponse>(url, {},
        { headers: new HttpHeaders().set('Authorization', `Basic ${encodedString}`) });
    });
  }

  refreshToken() {
    if (!this.tokenService.getToken()) {
      console.log("no token to refresh");
      return;
    }
    console.log("refreshing token", this.tokenService.getToken(), new Date());

    this.ConfigService.getConfiguration().flatMap((coreServices: CoreServices) => {
      const url = `${coreServices.auth}/tokens/refresh`;
      const encodedString = btoa(`token:${this.tokenService.getToken()}`); // base64 encoding

      return this.httpClient.post<TokenResponse>(url, {},
        { headers: new HttpHeaders().set('Authorization', `Basic ${encodedString}`) });

    }).subscribe((response: TokenResponse) => {
      let roles = JSON.parse(response.rolesJson);
      this.tokenService.setAuthToken(response.tokenKey, response.username, response.validUntil, roles);
    }, (error: any) => {

      if (error.status === 403) {
        console.log("got forbidden when trying to refresh token, stopping periodic token refresh");
        this.stopTokenRefresh();
      } else {
        console.log("refresh token failed", error.status, error.statusText);
      }
    });
  }

  scheduleTokenRefresh() {
    this.tokenRefreshSchedulerId = setInterval(this.refreshToken.bind(this), TOKEN_REFRESH_INTERVAL);
  }

  stopTokenRefresh() {
    clearInterval(this.tokenRefreshSchedulerId);
  }

  getUser(): Observable<User> {
    return this.ConfigService.getConfiguration().flatMap((coreServices: CoreServices) => {
      const userId = encodeURIComponent(this.tokenService.getUsername());
      const url = `${coreServices.auth}/users/${userId}`;    

      return <Observable<User>> this.authHttpClient.getAuth(url)
        .catch(err => {
          this.restErrorService.handleError(err, 'failed to get the user details');
          throw err;
        });
    });
  }

  getUsers(): Observable<User[]> {
    return this.ConfigService.getConfiguration().flatMap((coreServices: CoreServices) => {
      const url = `${coreServices.auth}/users`;    

      return <Observable<User[]>> this.authHttpClient.getAuth(url)
        .catch(err => {
          this.restErrorService.handleError(err, 'failed to get users');
          throw err;
        });
    });
  }
}

