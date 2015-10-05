chipsterWeb.factory('SessionRestangular',function(Restangular,AuthenticationService){

		return Restangular.withConfig(function(RestangularConfigurer) {
    		RestangularConfigurer.setBaseUrl('http://0.0.0.0:8080/sessionstorage/sessions/');
    		RestangularConfigurer.setDefaultHeaders({
    			'Authorization': 'Basic ' + btoa('token' + ':' +AuthenticationService.getToken())
    		});
  });

		
});


