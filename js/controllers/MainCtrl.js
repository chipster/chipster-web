chipsterWeb.controller('MainCtrl', function($scope, $location, AuthenticationService, SessionRestangular, ConfigService){

	$scope.getHost = function () {
		return ConfigService.getApiUrl();
	};

	$scope.isLoggedOut=function(){	
		if(AuthenticationService.getToken()===null){
			return true;
		}
	};
	
	$scope.logout=function(){
		AuthenticationService.logout();
		 $location.path("/");
	};
	
	$scope.isLoggedIn=function(){
		if(AuthenticationService.getToken()!==null){
			return true;
		}
	};
});