import ConfigService from "../services/config.service";
import * as restangular from "restangular";
import IService = restangular.IService;

export default class ToolResource {

	static $inject = ['Restangular', 'ConfigService'];

	service: any;

	constructor(private restangular: restangular.IService,
				private configService: ConfigService) {
	}

	getService() {
		// init service only once
		if (!this.service) {
			// getToolBoxUrl() returns a Promise
			// this.service will be a promise that resolves to a Restangular service
			this.service = this.configService.getToolboxUrl().then((url: string) => {
				// return the Restangular service
				return this.restangular.withConfig((RestangularConfigurer: any) => {
					RestangularConfigurer.setBaseUrl(url);
					RestangularConfigurer.setFullResponse(true);
				});
			});
		}
		return this.service;
	}

	getModules() {
		return this.getService().then((service: IService) => service.all('modules').getList());
	}

	getTools() {
		return this.getService().then((service: IService) => service.all('tools').getList());
	}

	getSourceCode(toolId: string): Promise<string> {
		return this.getService()
			.then((service: IService) => service.one('tools', toolId).customGET('source'))
			.then((response: any) => response.data);
	}
};
