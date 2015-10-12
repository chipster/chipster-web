chipsterWeb.factory('SessionRestangular',function(Restangular,AuthenticationService){

		return Restangular.withConfig(function(RestangularConfigurer) {

    		RestangularConfigurer.setBaseUrl(AuthenticationService.getSessionUrl());
    		RestangularConfigurer.setDefaultHeaders({
    			'Authorization': 'Basic ' + btoa('token' + ':' +AuthenticationService.getToken())
    		});
    		RestangularConfigurer.setFullResponse(true);

  });

		
});


