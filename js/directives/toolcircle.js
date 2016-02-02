/**
* @desc toolCircle directive for generating colored coded circle icon for each tool category
* @example <div><tool-circle toolcolor="tool.color"></div>
**/
 chipsterWeb.directive('toolCircle',function(){
	return{
		restrict:'EA',
		scope : {
			toolcolor : "=",
			toolname: "="
		},
		template: "<canvas id='tcanvas' width='160' height='20'/>",
		link:function(scope,element,attrs){
			scope.canvas=element.find('canvas')[0];
			
			scope.context=scope.canvas.getContext('2d');
			var centerX=20;
			var centerY=scope.canvas.height/2;
			var radius=3;
			
			scope.context.beginPath();
			scope.context.arc(centerX,centerY,radius,0,2*Math.PI,false);
			scope.context.fillStyle=scope.toolcolor;
			scope.context.fill();
			
			//Drawing the text in the canvas
			scope.context.font="9pt sans-serif";
			scope.context.fillStyle="black";
			scope.context.fillText(scope.toolname,30,12);
		}
	};
});