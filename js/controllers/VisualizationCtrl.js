/**
 * @desc Visualization panel controller for loading the result components of analysis jobs in the visualization panel
 * @example <div ng-controller="VisualizationCtrl"></div>
 */

chipsterWeb.controller('VisualizationCtrl',function($scope){
	
	//blocks for the visualization controlling
	$scope.pdfFileName='Theory of Relativity';//name of the pdf result file to view
	$scope.pdfUrl='/js/json/sample.pdf';//get the result file from the server using the defined url
	$scope.scroll=0;
	$scope.loading='loading';
	
	$scope.getNavStyle=function(scroll){
		if(scroll>100) return 'pdf-controls fixed';
		else return 'pdf-controls';
		
	};
	
	$scope.onError=function(error){
		console.log(error);
	};
	
	$scope.onLoad=function(){
		$scope.loading='';
	};
	
	$scope.onProgress=function(progress){
		
	};
	
	
	
	
});