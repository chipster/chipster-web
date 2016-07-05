
import ConfigService from "../services/ConfigService";
import * as restangular from "restangular";
import AuthenticationService from "../authentication/authenticationservice";

export default class FileResource {

	static $inject = ['Restangular', 'AuthenticationService', 'ConfigService'];

	service: any;

	constructor(private restangular: restangular.IService,
				private authenticationService: AuthenticationService,
				private configService: ConfigService) {
		this.service = this.restangular.withConfig( configurer => {
			configurer.setBaseUrl(this.configService.getFileBrokerUrl());
			configurer.setDefaultHeaders(this.authenticationService.getTokenHeader());
			configurer.setFullResponse(true);
		});
	}

	getData(sessionId, datasetId) {
		return this.service.one('sessions', sessionId).one('datasets', datasetId).get();
	};


}