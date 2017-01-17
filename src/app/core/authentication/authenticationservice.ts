import ConfigService from "../../services/config.service";
import {Inject, Injectable} from "@angular/core";
import {Headers, Http, ResponseContentType, Response} from "@angular/http";
import {Observable} from "rxjs";
import {CoreServices} from "../core-services";
import {TokenService} from "./token.service";

@Injectable()
export default class AuthenticationService {


  constructor(private http: Http,
              private ConfigService: ConfigService,
              private tokenService: TokenService,
              @Inject('$rootScope') private $rootScope: ng.IRootScopeService,
              @Inject('$location') private $location: ng.ILocationService) {

    this.$rootScope.$on("$routeChangeStart", (event: any, next: any) => {
      if (next.$$route.authenticated) {
        var userAuth = this.tokenService.getToken();
        if (!userAuth) {
          console.log('token not found, forward to login');
          this.$location.path('/login');
        }
      }
    });

  }

  // Do the authentication here based on userid and password
  login(username: string, password: string): Observable<void> {
    // clear any old tokens
    this.tokenService.setAuthToken(null);
    return this.requestToken(username, password).map((response: any) => {
      let token = response.json().tokenKey;
      this.tokenService.setAuthToken(token);
    });
  };

  logout(): void {
    this.tokenService.clear();
  };

  requestToken(username: string, password: string): Observable<Response> {
    return this.ConfigService.getConfiguration().flatMap((coreServices: CoreServices) => {
      const url= `${coreServices.authenticationService}/tokens`;
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

