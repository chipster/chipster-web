chipsterWeb.directive('chipsterSpreadsheet',function(FileRestangular){
    return{
        restrict:'E',
        scope : {
            datasetId: '=',
            sessionId: '=',
            src: '='
        },
        template: '<div class="scrollable" id="tableContainer"></div>',
        link: function ($scope,element,attrs) {


            $scope.getSettings = function (array) {
                return {
                    data: array.slice(1),
                    colHeaders: array[0],
                    columnSorting: true,
                    manualColumnResize: true,
                    sortIndicator: true
                }
            };

            FileRestangular.getData($scope.sessionId, $scope.datasetId).then(function (resp) {
                // parse the file data using the JQuery-cvs library
                parserConfig = {
                    separator: '\t'
                };
                $.csv.toArrays(resp.data, parserConfig, function (err, array) {

                    var container = document.getElementById('tableContainer');

                    $scope.hot = new Handsontable(container, $scope.getSettings(array));
                });
            });
        }
    };
});