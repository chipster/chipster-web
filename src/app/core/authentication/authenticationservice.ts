import ConfigService from "../../services/config.service";
import {Inject, Injectable} from "@angular/core";
import {Headers} from "@angular/http";
import {RestService} from "../rest-services/restservice/rest.service";
import {Observable} from "rxjs";
import {CoreServices} from "../core-services";

@Injectable()
export default class AuthenticationService {

  tokenHeader: {};

  constructor(@Inject('$http') private $http: ng.IHttpService,
              private ConfigService: ConfigService,
              private restService: RestService,
              @Inject('$rootScope') private $rootScope: ng.IRootScopeService,
              @Inject('$location') private $location: ng.ILocationService) {

    this.$rootScope.$on("$routeChangeStart", (event: any, next: any) => {
      if (next.$$route.authenticated) {
        var userAuth = this.getToken();
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
    this.setAuthToken(null);
    return this.requestToken(username, password).map((response: any) => {
      let token = response.tokenKey;
      this.setAuthToken(token);
    });
  };

  logout(): void {
    localStorage.clear();
  };

  getTokenHeader(): any {
    this.updateTokenHeader();
    return this.tokenHeader;
  };

  requestToken(username: string, password: string): Observable<string> {
    return this.ConfigService.getConfiguration().flatMap((coreServices: CoreServices) => {
      const url= `${coreServices.authenticationService}/tokens`;
      const encodedString = btoa(`${username}:${password}`); // base64 encoding
      return this.restService.post(url, {
        withCredentials: true,
        headers: new Headers({
          Authorization: `Basic ${encodedString}`
        })
      });

    });
  }

  getToken(): string {
    return localStorage['ch-auth-token'];
  };

  setAuthToken(val: string): void {
    localStorage['ch-auth-token'] = val;
    this.updateTokenHeader();
  };

  updateTokenHeader(): void {
    // return always the same instance so that we can update it later
    if (!this.tokenHeader) {
      this.tokenHeader = {};
    }
    this.tokenHeader['Authorization'] = 'Basic ' + btoa('token' + ':' + this.getToken())
  };

}

