import ConfigService from "../services/config.service";
import * as restangular from "restangular";

export default class ToolController {

	static $inject = ['Restangular', 'ConfigService'];

	service: any;

	constructor(private restangular: restangular.IService,
				private configService: ConfigService) {
		this.service = this.restangular.withConfig( (RestangularConfigurer: any) => {
			RestangularConfigurer.setBaseUrl(this.configService.getToolboxUrl());
			RestangularConfigurer.setFullResponse(true);

		});
	}
};
