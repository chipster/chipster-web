//Controller for different toolse
chipsterWeb.controller('AnalysisToolTabController', function($scope,$window){
	$scope.tabs=[
		{ title: 'Microarray', content:'toolset'},
		{ title: 'NGS', content:'NGS toolset'},
		{ title: 'Miscelleneous', content:'Misc content'}
	];
});