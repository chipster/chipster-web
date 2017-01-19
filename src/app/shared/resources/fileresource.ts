
import ConfigService from "../../services/config.service";
import * as restangular from "restangular";
import IService = restangular.IService;
import {Injectable, Inject} from "@angular/core";
import {Observable} from "rxjs";
import {RestService} from "../../core/rest-services/restservice/rest.service";
import {Headers, ResponseType, ResponseContentType} from "@angular/http";
import {TokenService} from "../../core/authentication/token.service";

@Injectable()
export default class FileResource {

	service: any;

	constructor(@Inject('Restangular') private restangular: restangular.IService,
				private tokenService: TokenService,
				private configService: ConfigService,
        private restService: RestService) {
	}

	getService() {
		// init service only once
		if (!this.service) {
			// this.service will be a promise that resolves to a Restangular service
			this.service = this.configService.getFileBrokerUrl().toPromise().then((url: string) => {
				// return the Restangular service
				return this.restangular.withConfig((configurer: any) => {
					configurer.setBaseUrl(url);
					configurer.setDefaultHeaders(this.tokenService.getTokenHeader());
					configurer.setFullResponse(true);
				});
			});
		}
		return this.service;
	}

	getData(sessionId: string, datasetId: string): Observable<any> {
    const apiUrl$ = this.configService.getFileBrokerUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.get(`${url}/sessions/${sessionId}/datasets/${datasetId}`, true, {responseType: ResponseContentType.Text} ));
  }

  getLimitedData(sessionId: string, datasetId: string, maxBytes: number) {
    return this.getService().then((service: IService) => service
      .one('sessions', sessionId)
      .one('datasets', datasetId)
      .get({}, {'range': 'bytes=0-' + maxBytes}));
  }

  uploadData(sessionId: string, datasetId: string, data: string): Observable<any> {
    const apiUrl$ = this.configService.getFileBrokerUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.put(`{url}/sessions/${sessionId}/datasets/${datasetId}`, {data: data},  true ));
  }
}
