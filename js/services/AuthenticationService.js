chipsterWeb.factory('AuthenticationService',['$q','Restangular', function($q, $window, $rootScope,
	Restangular) {

	//Set event listener for token change if there are multiple tabs
	angular.element($window).on('storgae', function(event){
		if(event.key==='auth-token'){
			$rootScope.$apply();
		}
	});

	return{
		//Do the authentication here based on userid and password


		login:function(username,password){
			
		},

		logout:function(){

		},

		setAuthToken:function(val){
			console.log(val);
			$window.localStorage && $window.localStorage.setItem('auth-token',val);
			return this;
		},

		getToken:function(){
			return $window.localStorage && $window.localStorage.getItem('auth-token');
		}

	};
}]);