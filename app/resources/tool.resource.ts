import ConfigService from "../services/ConfigService";
/**
 * @desc factory Service to configure Restangular request for tools data, will replace later with real tool URL
 **/

ToolCtrl.$inject = ['Restangular', 'AuthenticationService', 'ConfigService'];

function ToolCtrl(Restangular, AuthenticationService, ConfigService) {
	return Restangular.withConfig(function(RestangularConfigurer) {
		RestangularConfigurer.setBaseUrl(ConfigService.getToolboxUrl());
		RestangularConfigurer.setFullResponse(true);
	});

};

export default ToolCtrl;