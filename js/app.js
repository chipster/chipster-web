var chipsterWeb=angular.module('ChipsterWeb',['ngRoute']);

//configure our route
chipsterWeb.config(['$routeProvider',
	function($routeProvider){
		$routeProvider

		//route for home page
		.when('/',{
			templateUrl:'views/home.html',
			controller:'mainController'
		})
		//route for login page
		.when('/login',{
				templateUrl:'views/login.html',
				controller:'loginController'
		});
}]);

//main controller
chipsterWeb.controller('mainController',function($scope){
	$scope.message="it is working";
});

//login controller
chipsterWeb.controller('loginController',function($scope){
	$scope.message="This is login screen";
});

chipsterWeb.controller('contactController', function($scope) {
		$scope.message = 'Contact us! JK. This is just a demo.';
});



