chipsterWeb.directive('chipsterPhenodata',function(FileRestangular, SessionRestangular, Utils){

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
                        /*
                        Cut two-way binding loops here.

                         If the user edited the table (source === 'edit'),
                         then the scope and server must be updated also. The same applies for
                         'paste' and 'autofill'. The latter are created when copying cells by
                         dragging the small rectangle in the corner of the selection.

                         But if the change came from the scope (source === 'loadData'), then
                         we must not update the scope, because it would create an infinite
                         loop.
                         */
                        //console.log(source);
                        if (source === 'edit' || source === 'autofill' || source === 'paste') {
                            $scope.latestEdit = new Date().getTime();
                            $scope.updateDatasets();
                        }
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

                $scope.updateDatasets();
            };

            $scope.removeColumn = function (index) {
                $scope.hot.alter('remove_col', index);

                $scope.updateDatasets();
            };

            $scope.reset = function() {
                angular.forEach($scope.datasets, function(dataset) {
                    if (Utils.getFileExtension(dataset.name) === 'tsv') {
                        $scope.resetTsv(dataset);
                    } else {
                        $scope.resetGenericFile(dataset);
                    }
                });

                $scope.updateView();
                $scope.updateDatasets(true);
            };

            $scope.resetTsv = function(dataset) {
                FileRestangular.getData($scope.sessionId, dataset.datasetId).then(function (resp) {

                    // parse the file data using the JQuery-cvs library
                    parserConfig = {
                        separator: '\t'
                    };
                    $.csv.toArrays(resp.data, parserConfig, function (err, fileArray) {

                        var metadata = [];

                        var fileHeaders = fileArray[0].filter( function(header) {
                            return $scope.startsWith(header, "chip.");
                        });

                        angular.forEach(fileHeaders, function(fileHeader) {
                            var entry = {
                                column: fileHeader,
                                key: 'sample',
                                value: fileHeader
                            };
                            metadata.push(entry);
                        });

                        dataset.metadata = metadata;
                    });
                });
            };

            $scope.resetGenericFile = function(dataset) {

                var metadata = [{
                    column: null,
                    key: 'sample',
                    value: dataset.name
                }];

                dataset.metadata = metadata;
            };

            $scope.startsWith = function(data, start) {
                return data.substring(0, start.length) === start;
            };

            $scope.getHeaders = function (datasets) {
                // collect all headers
                var headers = {};
                angular.forEach(datasets, function(dataset) {
                    angular.forEach(dataset.metadata, function(entry) {
                        headers[entry.key] = true;
                    });
                });
                return Object.keys(headers);
            };

            $scope.getRows = function (datasets, headers) {

                var array = [];

                // get the row of a specific dataset and column if it exists already
                // or create a new row
                function getRow(datasetId, column) {
                    // find the existing row
                    for (var i = 0; i < array.length; i++) {
                        if (array[i].datasetId === datasetId && array[i].columnName === column) {
                            return array[i];
                        }
                    }

                    // create a new row
                    // fill the row with undefined values
                    row = Array.apply(null, Array(headers.length)).map(function () {return undefined});

                    // store datasetId and columnName as properties to hide them from the table
                    row.datasetId = datasetId;
                    row.columnName = column;
                    array.push(row);

                    return row;
                }

                angular.forEach(datasets, function(dataset) {

                    angular.forEach(dataset.metadata, function(entry) {
                        var row = getRow(dataset.datasetId, entry.column);
                        row[headers.indexOf(entry.key)] = entry.value;
                    });
                });
                return array;
            };

            $scope.updateDataset = function(dataset) {
                var datasetUrl = SessionRestangular.one('sessions', $scope.sessionId).one('datasets').one(dataset.datasetId);

                datasetUrl.customPUT(dataset).catch( function(res) {
                        console.log('dataset updated failed: ' + res);
                });
            };

            $scope.updateDatasets = function (updateAll) {

                var metadataMap = {};
                var array = $scope.array;
                var headers = $scope.headers;

                array.forEach( function(row) {

                    for (var i = 0; i < headers.length; i++) {
                        var entry = {
                            column: row.columnName,
                            key: headers[i],
                            value: row[i]
                        };

                        if (!metadataMap[row.datasetId]) {
                            metadataMap[row.datasetId] = [];
                        }

                        metadataMap[row.datasetId].push(entry);
                    }
                });

                angular.forEach($scope.datasets, function(dataset) {
                    var newMetadata = metadataMap[dataset.datasetId];
                    if (updateAll || !angular.equals(newMetadata, dataset.metadata)) {
                        dataset.metadata = newMetadata;
                        $scope.updateDataset(dataset);
                    }
                });
            };

            $scope.updateView = function() {

                var headers = $scope.getHeaders($scope.datasets);
                var array = $scope.getRows($scope.datasets, headers);

                if (!angular.equals(headers, $scope.headers)) {
                    $scope.headers = headers;

                    // remove old table if this is an update
                    var container = document.getElementById('tableContainer');
                    while (container.firstChild) {
                        container.removeChild(container.firstChild);
                    }

                    $scope.hot = new Handsontable(container, $scope.getSettings($scope.array, $scope.headers));
                }

                $scope.array = array;
                $scope.hot.loadData($scope.array);
            };

            $scope.updateViewLater = function() {
                function isEditingNow() {
                    return new Date().getTime() - $scope.latestEdit < 1000;
                }

                if (!isEditingNow()) {
                    $scope.updateView();

                } else {

                    /*
                     Defer updates when the table is being edited

                     Imagine the following sequence of events:
                     1. user fills in row 1
                     2. the changes are pushed to the server
                     3. user fills in row 2
                     4. we receive a notification about the first dataset change and update the table,
                     reverting the users changes on the line 2
                     5. user fills in row 3
                     6. the changes are pushed to the server, including the reverted line 2

                     The probability of this is now considerably reduced by delaying the updates in stage
                     4 when the table is being edited.

                     The other option would be to save some edit timestamps or edit sources on the server
                     so that we could recognize the events that we have create ourselves and wouldn't have
                     to apply them to the table.
                     */

                    if (!$scope.deferredUpdatesTimer) {
                        $scope.deferredUpdatesTimer = setInterval(function () {
                            if (!isEditingNow()) {
                                clearInterval($scope.deferredUpdatesTimer);
                                $scope.deferredUpdatesTimer = undefined;
                                $scope.updateView();
                            }
                        }, 100);
                    }
                }
            };

            $scope.$watch('datasets', function (newValue, oldValue) {
                $scope.updateViewLater();
            }, true);

            $scope.updateView();
        }
    };
});