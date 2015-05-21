//Controller for specific processing tools
chipsterWeb.controller('AnalysisToolOptionController', function($scope){
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