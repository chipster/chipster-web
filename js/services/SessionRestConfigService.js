chipsterWeb.factory('SessionRestConfigService',function(Restangular,AuthenticationService){

		return Restangular.withConfig(function(RestangularConfigurer) {
    // service has different address from serviceB
    		RestangularConfigurer.setBaseUrl('http://0.0.0.0:8080/sessionstorage/sessions/');
    		RestangularConfigurer.setDefaultHeaders({
    			'Authorization': 'Basic ' + btoa('token' + ':' +AuthenticationService.getToken())
    		});
  });

		
});


