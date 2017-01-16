import AuthenticationService from "../../core/authentication/authenticationservice";
import * as restangular from "restangular";
import ConfigService from "../../services/config.service";
import {Inject, Injectable} from "@angular/core";
import {RestService} from "../../core/rest-services/restservice/rest.service";
import {Headers, Http} from "@angular/http";
import {Observable} from "rxjs";

@Injectable()
export class SessionWorkerResource {

  public service: any;

  constructor(private authenticationService: AuthenticationService,
              private configService: ConfigService,
              private restService: RestService) {
  }

  getPackageUrl(sessionId: string): Observable<string> {
    const apiUrl$ = this.configService.getSessionWorkerUrl();
    return apiUrl$.map((url: string) => `${url}/sessions/${sessionId}?token=${this.authenticationService.getToken()}` );
  };

  extractSession(sessionId: string, zipDatasetId: string): Observable<any> {
    const apiUrl$ = this.configService.getSessionWorkerUrl();
    return apiUrl$.flatMap((url: string) => this.restService.post(`${url}/sessions/${sessionId}/datasets/${zipDatasetId}`, {
      headers: new Headers({
        Authorization: this.authenticationService.tokenHeader['Authorization']
      })
    }))
  }

}
