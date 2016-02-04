chipsterWeb.factory('FileRestangular',function(Restangular,AuthenticationService,baseURLString){

		var service = Restangular.withConfig(function(RestangularConfigurer) {

			RestangularConfigurer.setBaseUrl(baseURLString + 'filebroker' + '/');
			RestangularConfigurer.setDefaultHeaders({
				'Authorization': 'Basic ' + btoa('token' + ':' + AuthenticationService.getToken())
			});
			RestangularConfigurer.setFullResponse(true);
		});

		service.getData = function (sessionId, datasetId) {
			return this.one('sessions', sessionId)
				.one('datasets', datasetId)
				.get();
		};

		return service;
});


