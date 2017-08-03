import {ConfigService} from "../../shared/services/config.service";
import {Injectable} from "@angular/core";
import {Headers, Http, ResponseContentType, Response} from "@angular/http";
import {Observable} from "rxjs";
import {CoreServices} from "../core-services";
import {TokenService} from "./token.service";

@Injectable()
export class AuthenticationService {

  constructor(private http: Http,
              private ConfigService: ConfigService,
              private tokenService: TokenService) {
  }

  // Do the authentication here based on userid and password
  login(username: string, password: string): Observable<void> {
    // clear any old tokens
    this.tokenService.setAuthToken(null, null);
    return this.requestToken(username, password).map((response: any) => {
      this.tokenService.setAuthToken(response.json().tokenKey, response.json().username);
    });
  };

  logout(): void {
    this.tokenService.clear();
  };

  requestToken(username: string, password: string): Observable<Response> {
    return this.ConfigService.getConfiguration().flatMap((coreServices: CoreServices) => {
      const url= `${coreServices.auth}/tokens`;
      const encodedString = btoa(`${username}:${password}`); // base64 encoding

      return this.http.post(url, {}, {
        withCredentials: true,
        responseType: ResponseContentType.Text,
        headers: new Headers({
          Authorization: `Basic ${encodedString}`
        })
      });
    });
  }
}

