chipsterWeb.factory('AuthenticationService',['localStorageService', function(localStorageService) {

	

	return{
		//Do the authentication here based on userid and password


		login:function(username,password){
			
		},

		logout:function(){
			localStorageService.clearAll();
		},

		setAuthToken:function(val){
			localStorageService.set('auth-token', val);
		},

		getToken:function(){
			return localStorageService.get('auth-token');
		}

		

	};
}]);