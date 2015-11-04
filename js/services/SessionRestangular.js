chipsterWeb.factory('SessionRestangular',function(Restangular,AuthenticationService){

		return Restangular.withConfig(function(RestangularConfigurer) {

    		RestangularConfigurer.setBaseUrl('http://localhost:8000/sessiondb/');
    		RestangularConfigurer.setDefaultHeaders({
    			'Authorization': 'Basic ' + btoa('token' + ':' +AuthenticationService.getToken())
    		});
    		RestangularConfigurer.setFullResponse(true);

  });

		
});


