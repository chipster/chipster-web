
import ConfigService from "../services/config.service";
import * as restangular from "restangular";
import AuthenticationService from "../core/authentication/authenticationservice";
import IService = restangular.IService;

export default class FileResource {

	static $inject = ['Restangular', 'AuthenticationService', 'ConfigService'];

	service: any;

	constructor(private restangular: restangular.IService,
				private authenticationService: AuthenticationService,
				private configService: ConfigService) {
	}

	getService() {
		// init service only once
		if (!this.service) {
			// this.service will be a promise that resolves to a Restangular service
			this.service = this.configService.getFileBrokerUrl().toPromise().then((url: string) => {
				// return the Restangular service
				return this.restangular.withConfig((configurer: any) => {
					configurer.setBaseUrl(url);
					configurer.setDefaultHeaders(this.authenticationService.getTokenHeader());
					configurer.setFullResponse(true);				});
			});
		}
		return this.service;
	}

	getData(sessionId: string, datasetId: string) {
		return this.getService().then((service: IService) => service
			.one('sessions', sessionId)
			.one('datasets', datasetId)
			.get());
	}

  getLimitedData(sessionId: string, datasetId: string, maxBytes: number) {
    return this.getService().then((service: IService) => service
      .one('sessions', sessionId)
      .one('datasets', datasetId)
      .get({}, {'range': 'bytes=0-' + maxBytes}));
  }

	uploadData(sessionId: string, datasetId: string, data: string) {
		return this.getService().then((service: IService) => service
			.one('sessions', sessionId)
			.one('datasets', datasetId)
			.customPUT(data));
	}
}
