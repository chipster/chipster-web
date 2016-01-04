/**
* @desc toolText directive for generating styled tool names for the tool table
* @example <div><tool-text toolname="tool.name"></div>
**/
 chipsterWeb.directive('toolText',function(){
	return{
		restrict:'EA',
		scope : {
			toolname: "="
		},
		template: "<canvas id='txtcanvas' width='300' height='20'/>",
		link:function(scope,element,attrs){
			scope.canvas=element.find('canvas')[0];
			
			scope.context=scope.canvas.getContext('2d');
		
			//Drawing the text in the canvas
			scope.context.font="9pt sans-serif";
			scope.context.fillStyle="black";
			scope.context.fillText(scope.toolname,5,12);
		}
	};
});