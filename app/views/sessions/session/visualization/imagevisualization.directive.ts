angular.module('chipster-web').directive('imageVisualization',function(){
    return{
        restrict:'E',
        scope : {
            src: '='
        },
        template: '<div class="scrollable"><img ng-src="{{src}}"></div>'
    };
});