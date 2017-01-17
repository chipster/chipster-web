import AuthenticationService from "../../core/authentication/authenticationservice";
import ConfigService from "../../services/config.service";
import {Inject, Injectable} from "@angular/core";
import {RestService} from "../../core/rest-services/restservice/rest.service";
import {Headers, Http} from "@angular/http";
import {Observable} from "rxjs";
import {TokenService} from "../../core/authentication/token.service";

@Injectable()
export class SessionWorkerResource {

  public service: any;

  constructor(private tokenService: TokenService,
              private configService: ConfigService,
              private restService: RestService) {
  }

  getPackageUrl(sessionId: string): Observable<string> {
    const apiUrl$ = this.configService.getSessionWorkerUrl();
    return apiUrl$.map((url: string) => `${url}/sessions/${sessionId}?token=${this.tokenService.getToken()}` );
  };

  extractSession(sessionId: string, zipDatasetId: string): Observable<any> {
    const apiUrl$ = this.configService.getSessionWorkerUrl();
    return apiUrl$.flatMap((url: string) => this.restService.post(`${url}/sessions/${sessionId}/datasets/${zipDatasetId}`, true))
  }

}
