chipsterWeb.directive('chipsterPhenodata',function(FileRestangular){
    return{
        restrict:'E',
        scope : {
            datasetId: "=",
            sessionId: "=",
            src: "="
        },
        template: '<br><h4>Phenodata editor</h4><hot-table datarows="array"></hot-table>',
        link: function ($scope,element,attrs) {
            FileRestangular.getData($scope.sessionId, $scope.datasetId).then(function (resp) {
                // parse the file data using the JQuery-cvs library
                parserConfig = {
                    separator: '\t'
                };
                $.csv.toArrays(resp.data, parserConfig, function (err, array) {
                    $scope.array = array;
                });
            });
        }
    };
});