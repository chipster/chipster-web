var chipsterWeb=angular.module('chipster-web',['ngRoute','flow','ui.tree','panzoom','panzoomwidget','restangular']);

//configure our route
chipsterWeb
	.config(['$routeProvider','RestangularProvider',function ($routeProvider,RestangularProvider){
	//Config the base url
	RestangularProvider.setBaseUrl('http://localhost:8082/servicelocator');
	
	//Before redirection to specific pages, check if the user is authenticated or not


	var redirectIfAuthenticatedUser=function(route){
		return function($location, $q, AuthenticationService){
			var deferred=$q.defer();
			if(AuthenticationService.getToken()){
				deferred.reject();
				$location.path(route);
			}else{
				deferred.resolve();
			}
			return deferred.promise;
		};
	};

	var redirectIfNotAuthenticatedUser=function(route){
		return function($location, $q, AuthenticationService){
			var deferred=$q.defer();
			if(!AuthenticationService.getToken()){
				deferred.reject();
				$location.path(route);
			}else{
				deferred.resolve();
			}
			return deferred.promise;
		};
	};



	$routeProvider
		//route for home page
		.when('/',{
			templateUrl:'partials/home.html',
			controller:'mainController'
		})
		//route for login page
		.when('/login',{
			templateUrl:'partials/login.html',
			controller:'LoginCtrl'
		})
		.when('/visualization',{
			templateUrl:'partials/visualization.html'
		})
		.when('/dataset',{
			templateUrl:'partials/dataset.html',
			resolve:{
				redirectIfNotAuthenticatedUser:redirectIfNotAuthenticatedUser('/')
			}

		})
		.when('/session',{
			templateUrl:'partials/session.html'				
		});

	}]);

chipsterWeb.config(['flowFactoryProvider',function (flowFactoryProvider){
	flowFactoryProvider.defaults={
		target:'',
		permanentErrors:[404,500,501],
		maxChunkRetries:1,
		chunkRetryInterval:5000,
		simultaneousUploads:4

	};
	flowFactoryProvider.on('catchAll', function (event){
		console.log('catchAll', arguments)
	});

}]);



//main controller,wrapped in a function to avoid generating global constructor function as ng-controller


	(function() {

    chipsterWeb
        .controller("mainCtrl", mainCtrl);

    mainCtrl.$inject = ["$scope"];

    function mainCtrl($scope) {
        $scope.message = "This is main controller";
    };

})();













