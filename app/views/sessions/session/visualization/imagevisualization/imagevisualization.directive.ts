export default function(){
    return{
        restrict:'E',
        scope : {
            src: '='
        },
        template: '<div class="scrollable"><img ng-src="{{src}}"></div>'
    };
};