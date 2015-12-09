/**
 * @desc Resizable div controller for passing the resizing div events to other component controllers using 
 * library angular-resizable(https://github.com/Reklino/angular-resizable)
 * 
 * @example <div ng-controller="ResizableDivCtrl"></div>
 */

chipsterWeb.controller('ResizableDivCtrl',function($scope,$window){
	
	$scope.dynamicSize={
			'width':$window.innerWidth/3,
			'height':$window.innerHeight
	};
	
	$scope.size={};
	$scope.msg='resize div';
	
	$scope.events={};
	
	
	$scope.$on("angular-resizable.resizeEnd",function(event,args){
		console.log('resize ends');
		console.log(args.width);
		
	});
	
	$scope.$on("angular-resizable.resizeStart",function(event,args){
		console.log('resize starts');
	
		
	});
	
	
});