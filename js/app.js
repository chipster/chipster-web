var chipsterWeb=angular.module('ChipsterWeb',['ngRoute','ui.bootstrap']);
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
		})
		.when('/dataset',{
			templateUrl:'views/dataset.html'
		})
		.when('/analysisTools',{
			templateUrl:'views/toolSource.html'
		})
		.when('/visualization',{
			templateUrl:'views/visualization.html'
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

//Controller for different toolse
chipsterWeb.controller('toolTabController', function($scope,$window){
	$scope.tabs=[
		{ title: 'Microarray', content:'toolset'},
		{ title: 'NGS', content:'NGS toolset'},
		{ title: 'Miscelleneous', content:'Misc content'}
	];
});

//Controller for specific processing tools
chipsterWeb.controller('toolAccordionController', function($scope){
	$scope.oneAtATime=true;

	$scope.groups=[
		{
			title: 'Normalization',
			content: 'Simple Normalization'
		},
		{
			title: 'Quality Control',
			content: 'PCA Quality Control'
		}
	];

	$scope.status={
		isFirstOpen:true,
		isFirstDisabled:false
	};

});



