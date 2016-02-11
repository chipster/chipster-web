chipsterWeb.directive('chipsterPhenodata',function(FileRestangular, SessionRestangular){

    return {
        restrict:'E',
        scope : {
            datasets: '=selectedDatasets',
            datasetId: '=',
            sessionId: '=',
            src: '='
        },
        templateUrl: 'partials/chipsterphenodata.html',

        link: function ($scope,element,attrs) {

            /*FileRestangular.getData($scope.sessionId, $scope.datasetId).then(function (resp) {

                // parse the file data using the JQuery-cvs library
                parserConfig = {
                    separator: '\t'
                };
                $.csv.toArrays(resp.data, parserConfig, function (err, array) {

                    var container = document.getElementById('tableContainer');
                    $scope.hot = new Handsontable(container, $scope.getSettings(array));
                });
            });*/

            $scope.getSettings = function (array, headers) {
                return {
                    data: array,
                    colHeaders: headers,
                    columnSorting: true,
                    manualColumnResize: true,
                    sortIndicator: true,

                    afterGetColHeader: function(col, TH) {
                        if (headers[col] === 'sample' || headers[col] === 'original_name') {
                            // removal not allowed
                            return;
                        }
                        $scope.createRemoveButton(col, TH);
                    },

                    afterChange: function(changes, source) {
                        $scope.updateDatasets(array, headers);
                    }
                }
            };

            $scope.createRemoveButton = function (col, TH) {
                var button = document.createElement('A');
                button.className = 'btn btn-xs pull-right phenodata-header-button';
                var span = document.createElement('SPAN');
                span.className = 'glyphicon glyphicon-remove';
                button.appendChild(span);

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

            $scope.getHeaders = function (metadata) {
                return Object.keys(metadata);
            };

            /*
            Convert metadata object to an array row
             */
            $scope.getRow = function (metadata, headers, datasetId, columnName) {
                var row = [];
                angular.forEach(headers, function(colName) {
                    row.push(metadata[colName]);
                });

                // store datasetId and columnName as properties to hide them from the table
                row.datasetId = datasetId;
                row.columnName = columnName;

                return row;
            };

            /*
            Convert an array to object keys with value 'true'. Effectively removes all duplicates,
             i.e. creates a set.
             */
            $scope.arrayToSet = function (array) {
                var obj = {};
                angular.forEach(array, function (item) {
                  obj[item] = true;
                });
                return obj;
            };

            $scope.getAllHeaders = function (datasets) {
                // collect all headers
                var allHeaders = {};
                angular.forEach(datasets, function(dataset) {
                    angular.forEach(dataset.columns, function(column) {
                        var headers = $scope.getHeaders(column.metadata);
                        angular.extend(allHeaders, $scope.arrayToSet(headers));
                    });
                    var headers = $scope.getHeaders(dataset.metadata);
                    angular.extend(allHeaders, $scope.arrayToSet(headers));
                });
                return Object.keys(allHeaders);
            };

            $scope.getAllRows = function (datasets, headers) {

                // create a row for all metadata columns and datasets
                var array = [];

                angular.forEach(datasets, function(dataset) {
                    angular.forEach(dataset.columns, function(column) {
                        array.push($scope.getRow(column.metadata, headers, dataset.datasetId, column.name));
                    });
                    array.push($scope.getRow(dataset.metadata, headers, dataset.datasetId, null));
                });
                return array;
            };

            /*
            convert an array row to metadata object
             */
            $scope.getMetadata = function(row, headers) {
                var metadata = {};
                for (var i = 0; i < headers.length; i++) {
                    metadata[headers[i]] = row[i];
                }
                return metadata;
            };

            /*
            Get a dataset with a given id from the array.
             */
            $scope.getDataset = function(datasets, datasetId) {
                for (var i = 0; i < datasets.length; i++) {
                    var dataset = datasets[i];
                    if (dataset.datasetId === datasetId) {
                        return dataset;
                    }
                }
            };

            /*
            Get a column with a given name from the array.
             */
            $scope.getColumn = function(columns, columnName) {
                for (var i = 0; i < columns.length; i++) {
                    var column = columns[i];
                    if (column.name === columnName) {
                        return column;
                    }
                }
            };

            $scope.updateDataset = function(dataset) {
                var datasetUrl = SessionRestangular.one('sessions', $scope.sessionId).one('datasets').one(dataset.datasetId);

                datasetUrl.customPUT(dataset).catch( function(res) {
                        console.log('dataset updated failed: ' + res);
                });
            };

            $scope.updateDatasets = function (array, headers) {

                array.forEach( function(row) {
                    var dataset = $scope.getDataset($scope.datasets, row.datasetId);

                    if (row.columnName) {
                        var column = $scope.getColumn(dataset.columns, row.columnName);
                        angular.extend(column.metadata, $scope.getMetadata(row, headers));
                    } else {
                        angular.extend(dataset.metadata, $scope.getMetadata(row, headers));
                    }
                });


                angular.forEach($scope.datasets, function(dataset) {
                    $scope.updateDataset(dataset);
                });
            };

            var headers = $scope.getAllHeaders($scope.datasets);
            var array = $scope.getAllRows($scope.datasets, headers);

            var container = document.getElementById('tableContainer');
            console.log(array);
            $scope.hot = new Handsontable(container, $scope.getSettings(array, headers));
        }
    };
});