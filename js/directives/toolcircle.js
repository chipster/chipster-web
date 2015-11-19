/**
* @desc toolCircle directive for generating colored coded circle icon for each tool category
* @example <div><tool-circle toolcolor="tool.color"></div>
**/
 chipsterWeb.directive('toolCircle',function(){
	return{
		restrict:'EA',
		scope : {
			toolcolor : "="
		},
		template: "<canvas id='tcanvas' width='10' height='10' />",
		link:function(scope,element,attrs){
			scope.canvas=element.find('canvas')[0];
			
			scope.context=scope.canvas.getContext('2d');
			var centerX=scope.canvas.width/2;
			var centerY=scope.canvas.height/2;
			var radius=3;
			
			scope.context.beginPath();
			scope.context.arc(centerX,centerY,radius,0,2*Math.PI,false);
			scope.context.fillStyle=scope.toolcolor;
			scope.context.fill();
		}
	};
});