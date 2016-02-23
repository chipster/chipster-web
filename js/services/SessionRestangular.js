chipsterWeb.factory('SessionRestangular', function (Restangular, AuthenticationService, baseURLString) {

	var service = Restangular.withConfig(function (RestangularConfigurer) {

		RestangularConfigurer.setBaseUrl(baseURLString + 'sessiondb' + '/');
		// this service is initialized only once, but the Authentication service will update the returned
		// instance when necessary (login & logout) so that the request is always made with the most up-to-date
		// credentials
		RestangularConfigurer.setDefaultHeaders(AuthenticationService.getTokenHeader());
		RestangularConfigurer.setFullResponse(true);
	});

	// Restangular adds an empty object to the body of the DELETE request, which fails somewhere
	// on the way, not sure where.
	//
	// https://github.com/mgonto/restangular/issues/78
	service.addRequestInterceptor( function(elem, operation) {
		if (operation === 'remove') {
			return undefined;
		}
		return elem;
	});

	return service;
});


