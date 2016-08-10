export default function(){

	 var radius=3;

	return{
		restrict:'EA',
		scope : {
			toolcolor : "="
		},
		template: "<canvas id='tcanvas' width=" + (radius * 2 + 5) + " height=" + (radius * 2 + 2) + ">",
		link:function(
			scope: ng.IScope,
			element: any) {
			scope.canvas=element.find('canvas')[0];

			scope.context=scope.canvas.getContext('2d');

			var centerX=radius;
			var centerY=radius;

			scope.context.beginPath();
			scope.context.arc(centerX,centerY,radius,0,2*Math.PI,false);
			scope.context.fillStyle=scope.toolcolor;
			scope.context.fill();
		}
	};
};