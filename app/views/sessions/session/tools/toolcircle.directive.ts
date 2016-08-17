export default function(){

	 var radius=3;

	return{
		restrict:'EA',
		scope : {
			toolcolor : "="
		},
		template: "<canvas id='canvas' width=" + (radius * 2 + 5) + " height=" + (radius * 2 + 2) + ">",
		link:function(
			scope: ng.IScope,
			element: any) {
			let canvas = element.find('canvas')[0];

			let context = canvas.getContext('2d');

			let centerX = radius;
			let centerY = radius;

			context.beginPath();
			context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
			context.fillStyle = scope['toolcolor'];
			context.fill();
		}
	};
};