var chipsterWeb=angular.module('ChipsterWeb',['ngRoute','ui.bootstrap','flow']);

//configure our route
chipsterWeb
	.config(['$routeProvider',function ($routeProvider){
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
			templateUrl:'partials/dataset.html'
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
			flowFactoryProvider.on('catthAll', function (event){
				console.log('catchAll', arguments)
			});

}]);
		


//main controller
chipsterWeb.controller('mainCtrl',function($scope){
	$scope.message="it is working";
});













