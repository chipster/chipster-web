chipsterWeb.directive('chipsterText',function(FileRestangular){
    return{
        restrict:'E',
        scope : {
            datasetId: "=",
            sessionId: "=",
            src: "="
        },
        template: "<p>{{data}}</p>",
        link: function ($scope,element,attrs) {
            FileRestangular.getData($scope.sessionId, $scope.datasetId).then(function (resp) {
               $scope.data = resp.data;
            });
        }
    };
});