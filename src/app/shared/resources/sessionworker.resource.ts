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

  constructor(@Inject('Restangular') private restangular: restangular.IService,
              private authenticationService: AuthenticationService,
              private configService: ConfigService,
              private restService: RestService,
              private http: Http) {
  }

  getService() {

    if (!this.service) {
      this.service = this.configService.getSessionWorkerUrl().toPromise().then((url: string) => {

        return this.restangular.withConfig((configurer: any) => {
          configurer.setBaseUrl(url);
          // this service is initialized only once, but the Authentication service will update the returned
          // instance when necessary (login & logout) so that the request is always made with the most up-to-date
          // credentials
          configurer.setDefaultHeaders(this.authenticationService.getTokenHeader());
          configurer.setFullResponse(true);
        });
      });
    }
    return this.service;
  }

  // getPackageUrl(sessionId: string): Observable<string> {
  //   const apiUrl$ = this.configService.getSessionWorkerUrl();
  //   return apiUrl$.flatMap((url: string) => this.http.get(`${url}/sessions/${sessionId}?token=${this.authenticationService.getToken()}`));
  // };

  getPackageUrl(sessionId: string) {
  	return this.getService().then((service:restangular.IService) => {
  	return URI(service.one('sessions', sessionId).getRestangularUrl())
  		.addSearch('token', this.authenticationService.getToken()).toString();
  	});
  }


  extractSession(sessionId: string, zipDatasetId: string): Observable<any> {
    const apiUrl$ = this.configService.getSessionWorkerUrl();
    return apiUrl$.flatMap((url: string) => this.restService.post(`${url}/sessions/${sessionId}/datasets/${zipDatasetId}`, {
      headers: new Headers({
        Authorization: this.authenticationService.tokenHeader['Authorization']
      })
    }))
  }

}
