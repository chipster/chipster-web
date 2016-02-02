/**
 * @desc factory Service to configure Restangular request for tools data, will replace later with real tool URL
 **/
chipsterWeb.factory('ToolRestangular', function(Restangular,
		AuthenticationService) {
	return Restangular.withConfig(function(RestangularConfigurer) {
		RestangularConfigurer.setBaseUrl('http://vm0179.kaj.pouta.csc.fi:8000/toolbox/');
		RestangularConfigurer.setFullResponse(true);
	});

});
