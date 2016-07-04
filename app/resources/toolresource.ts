import ConfigService from "../services/ConfigService";
import * as restangular from "restangular";

export default class ToolController {

	static $inject = ['Restangular', 'ConfigService'];

	service: any;

	constructor(private restangular: restangular.IService,
				private configService: ConfigService) {
		this.service = this.restangular.withConfig( (RestangularConfigurer) => {
			RestangularConfigurer.setBaseUrl(this.configService.getToolboxUrl());
			RestangularConfigurer.setFullResponse(true);

		});
	}
};
