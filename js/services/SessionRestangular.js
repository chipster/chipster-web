chipsterWeb.factory('SessionRestangular',function(Restangular,AuthenticationService){

		return Restangular.withConfig(function(RestangularConfigurer) {
    		RestangularConfigurer.setBaseUrl('http://vm0179.kaj.pouta.csc.fi:8080/sessionstorage/sessions/');
    		RestangularConfigurer.setDefaultHeaders({
    			'Authorization': 'Basic ' + btoa('token' + ':' +AuthenticationService.getToken())
    		});
  });

		
});


