chipsterWeb.factory('SessionRestangular',function(Restangular,AuthenticationService,baseURLString){

		return Restangular.withConfig(function(RestangularConfigurer) {

    		RestangularConfigurer.setBaseUrl(baseURLString+'sessiondb'+'/');
    		RestangularConfigurer.setDefaultHeaders({
    			'Authorization': 'Basic ' + btoa('token' + ':' +AuthenticationService.getToken())
    		});
    		RestangularConfigurer.setFullResponse(true);

  });

		
});


