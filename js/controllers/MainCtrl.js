chipsterWeb.controller('MainCtrl', function($scope, $location, AuthenticationService){

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