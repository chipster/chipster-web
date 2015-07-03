chipsterWeb.controller('SpreadSheetCtrl', function($scope) {

	$scope.columns=['A','B','C','D','E','F'];// Defining how many columns with colum labels
	$scope.rows=[1,2,3,4,5,6];//Defining how many rows
	$scope.cells={};

	

	$scope.compute=function(cell){
		// need to return the data point value for that specific cell
		return "hello";
	};

  
});