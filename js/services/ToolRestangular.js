/**
 * @desc factory Service to configure Restangular request for tools data, will replace later with real tool URL
 **/
chipsterWeb.factory('ToolRestangular', function(Restangular, AuthenticationService, baseURLString) {
	return Restangular.withConfig(function(RestangularConfigurer) {
		RestangularConfigurer.setBaseUrl(baseURLString + 'toolbox/');
		RestangularConfigurer.setFullResponse(true);
	});

});
