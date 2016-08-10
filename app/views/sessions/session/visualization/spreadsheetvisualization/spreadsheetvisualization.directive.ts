
import FileResource from "../../../../../resources/fileresource";
spreadsheetVisualization.$inject = ['FileResource'];

function spreadsheetVisualization(FileResource: FileResource){
    return{
        restrict:'E',
        scope : {
            datasetId: '=',
            sessionId: '=',
            src: '='
        },
        template: '<div id="tableContainer"></div>',
        link: function ($scope: ng.IScope) {

            FileResource.getData($scope.sessionId, $scope.datasetId).then(function (resp: any) {

                // parse the file data using the JQuery-cvs library
                let parserConfig = {
                    separator: '\t'
                };
                $.csv.toArrays(resp.data, parserConfig, function (err: any, array: string[][]) {

                    var container = document.getElementById('tableContainer');

                    $scope.hot = new Handsontable(container, $scope.getSettings(array));
                });
            });

            $scope.getSettings = function (array: string[][]) {
                return {
                    data: array.slice(1),
                    colHeaders: array[0],
                    columnSorting: true,
                    manualColumnResize: true,
                    sortIndicator: true,
                    readOnly: true
                }
            };
        }
    };
}

export default spreadsheetVisualization;