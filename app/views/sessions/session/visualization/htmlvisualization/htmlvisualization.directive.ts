htmlVisualization.$inject = ['$sce'];

function htmlVisualization($sce){
    return{
        restrict:'E',
        scope : {
            src: "="
        },
        // show in iFrame sandbox without any capabilities
        // considering later what capabilities are needed
        template: '<iframe frameBorder="0" sandbox="" width="100%" height="100%" ng-src="{{getUrl()}}"></iframe>',

        link: function ($scope) {

            $scope.getUrl = function () {
                return $sce.trustAsResourceUrl($scope.src + '&download=false&type=true');
            };
        }
    };
};

export default htmlVisualization;