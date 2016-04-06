/**
 * @desc factory Service to configure Restangular request for tools data, will replace later with real tool URL
 **/
chipsterWeb.factory('ToolRestangular', function(Restangular, AuthenticationService, ConfigService) {
	return Restangular.withConfig(function(RestangularConfigurer) {
		RestangularConfigurer.setBaseUrl(ConfigService.getToolboxUrl());
		RestangularConfigurer.setFullResponse(true);
	});

});
