chipsterWeb.directive('chipsterPhenodata',function(FileRestangular){

    return {
        restrict:'E',
        scope : {
            datasetId: "=",
            sessionId: "=",
            src: "=",
        },
        template:
        '<br/>' +
        '<div id="tableContainer"></div>' +
        '<br/>' +
        '<div class="input-group input-group-sm">' +
        '<input type="text" class="form-control" placeholder="Add new column..." ng-model="colName">' +
        '   <span class="input-group-btn">' +
        '       <button type="button" class="btn btn-default" ng-click="addColumn()">' +
        '           <span class="glyphicon glyphicon-plus" aria-hidden="true"></span>' +
        '      </button>' +
        '   </span>' +
        '</div>',

        link: function ($scope,element,attrs) {

            $scope.getSettings = function (array) {
                return {
                    data: array.slice(1),
                    colHeaders: array[0],
                    columnSorting: true,
                    manualColumnResize: true,
                    sortIndicator: true,
                    removeRowPlugin: true,

                    afterGetColHeader: function(col, TH) {
                        if (array[0][col] === 'sample' || array[0][col] === 'original_name') {
                            // removal not allowed
                            return;
                        }
                        createRemoveButton(col, TH);
                    }
                }
            };

            $scope.createRemoveButton = function (col, TH) {
                var button = document.createElement('A');
                button.className = 'btn btn-xs pull-right link-btn phenodata-header-button';
                var span = document.createElement('SPAN');
                span.className = 'glyphicon glyphicon-remove';
                button.appendChild(span);

                var instance = this;

                Handsontable.Dom.addEvent(button, 'click', function (event) {
                    $scope.removeColumn(col);
                });

                if (TH.firstChild.lastChild.nodeName === 'A') {
                    TH.firstChild.removeChild(TH.firstChild.lastChild);
                }
                TH.firstChild.appendChild(button);
            };

            $scope.addColumn = function () {
                var colHeaders = $scope.hot.getSettings().colHeaders;
                $scope.hot.alter('insert_col', colHeaders.length);
                // remove undefined column header
                colHeaders.pop();
                colHeaders.push($scope.colName);
                $scope.hot.updateSettings( {
                   colHeaders: colHeaders
                });
                $scope.colName = '';
            };

            $scope.removeColumn = function (index) {
                $scope.hot.alter('remove_col', index);
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