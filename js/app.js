var chipsterWeb = angular.module('chipster-web', [ 'ngRoute', 'flow','restangular',
		'LocalStorageModule','ngWebsocket'])
		
var baseURL='http://localhost:8000/';

//defining the base Url as constant
chipsterWeb.constant('baseURLString',baseURL);

// configure our route
chipsterWeb
		.config([
				'$routeProvider',
				'RestangularProvider',
				function($routeProvider, RestangularProvider) {
					// Config the base url
					RestangularProvider
							.setBaseUrl(baseURL);

					// Before redirection to specific pages, check if the user
					// is authenticated or not

					var redirectIfAuthenticatedUser = function(route) {
						return function($location, $q, AuthenticationService) {
							var deferred = $q.defer();
							if (AuthenticationService.getToken()) {
								deferred.reject();
								$location.path(route);
							} else {
								deferred.resolve();
							}
							return deferred.promise;
						};
					};

					var redirectIfNotAuthenticatedUser = function(route) {
						return function($location, $q, AuthenticationService) {
							var deferred = $q.defer();
							if (!AuthenticationService.getToken()) {
								deferred.reject();
								$location.path(route);
							} else {
								deferred.resolve();
							}
							return deferred.promise;
						};
					};

					$routeProvider
					// route for home page
					.when('/', {
						templateUrl : 'partials/home.html'
					}).when('/home', {
						templateUrl : 'partials/home.html'
					})
					// route for login page
					.when('/login', {
						templateUrl : 'partials/login.html',
						controller : 'LoginCtrl'
					}).when('/session/:sessionId', {
						templateUrl : 'partials/session_tmp.html',
						authenticated:true

					}).when('/sessions', {
						templateUrl : 'partials/sessionlist.html',
						authenticated : true

					});

				}]);

chipsterWeb.config(['flowFactoryProvider', function(flowFactoryProvider) {
	flowFactoryProvider.defaults = {
		target : '',
		permanentErrors : [ 404, 500, 501 ],
		maxChunkRetries : 1,
		chunkRetryInterval : 5000,
		simultaneousUploads : 4

	};
	flowFactoryProvider.on('catchAll', function(event) {
		console.log('catchAll', arguments);
	});

}]);

chipsterWeb.run(function($rootScope, $location, AuthenticationService){
			$rootScope.$on("$routeChangeStart",function(event,next,current){
				if(next.$$route.authenticated){
					var userAuth=AuthenticationService.getToken();
					if(!userAuth){
						$location.path('/');
						alert("You need to be logged in to access this page!")
					}
				}			
			}
		);
			
		
});
