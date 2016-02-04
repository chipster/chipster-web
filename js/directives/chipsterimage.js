chipsterWeb.directive('chipsterImage',function(){
    return{
        restrict:'E',
        scope : {
            src: "="
        },
        template: "<img ng-src='{{src}}'/>"
    };
});