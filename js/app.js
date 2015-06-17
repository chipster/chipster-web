var chipsterWeb=angular.module('ChipsterWeb',['ngRoute','ui.bootstrap']);
//configure our route
chipsterWeb.config(['$routeProvider',
	function($routeProvider){
		$routeProvider

		//route for home page
		.when('/',{
			templateUrl:'partials/home.html',
			controller:'mainController'
		})
		//route for login page
		.when('/login',{
				templateUrl:'partials/login.html',
				controller:'LoginController'
		})
		.when('/visualization',{
			templateUrl:'partials/visualization.html'
		})
		.when('/dataset',{
			templateUrl:'partials/dataset.html'
		});
		
}]);

//main controller
chipsterWeb.controller('mainController',function($scope){
	$scope.message="it is working";
});













