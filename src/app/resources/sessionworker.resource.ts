
import AuthenticationService from "../core/authentication/authenticationservice";
import * as restangular from "restangular";
import ConfigService from "../services/config.service";

export default class SessionResource {

	static $inject = ['Restangular', 'AuthenticationService', 'ConfigService', 'ToolResource'];

	public service: any;

	constructor(private restangular: restangular.IService,
				private authenticationService:AuthenticationService,
				private configService: ConfigService) {
	}

	getService() {

		if (!this.service) {
			this.service = this.configService.getSessionWorkerUrl().then((url: string) => {

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

	getPackageUrl(sessionId: string) {
		return this.getService().then((service:restangular.IService) => {
			return URI(service.one('sessions', sessionId).getRestangularUrl())
				.addSearch('token', this.authenticationService.getToken()).toString();
			});
	}

	extractSession(sessionId: string, zipDatasetId: string) {
		return this.getService().then((service:restangular.IService) => {
			return service
				.one('sessions', sessionId)
				.one('datasets', zipDatasetId).customPOST();
			}).then((res: any) => {
				return res.warnings;
			});
	}
}
