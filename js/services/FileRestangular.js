chipsterWeb.factory('FileRestangular',function(Restangular,AuthenticationService,baseURLString){

		return Restangular.withConfig(function(RestangularConfigurer) {

    		RestangularConfigurer.setBaseUrl(baseURLString+'filebroker'+'/');
    		RestangularConfigurer.setDefaultHeaders({
    			'Authorization': 'Basic ' + btoa('token' + ':' +AuthenticationService.getToken())
    		});
    		RestangularConfigurer.setFullResponse(true);
  });
});


