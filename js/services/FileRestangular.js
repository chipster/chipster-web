chipsterWeb.factory('FileRestangular',function(Restangular,AuthenticationService, ConfigService){

		var service = Restangular.withConfig(function(RestangularConfigurer) {

			RestangularConfigurer.setBaseUrl(ConfigService.getFileBrokerUrl());
			RestangularConfigurer.setDefaultHeaders(AuthenticationService.getTokenHeader());
			RestangularConfigurer.setFullResponse(true);
		});

		service.getData = function (sessionId, datasetId) {
			return this.one('sessions', sessionId)
				.one('datasets', datasetId)
				.get();
		};

		return service;
});


