import Utils from "../../../../../services/Utils";

class PhenodataVisualizationController {

    static $inject = ['FileResource', 'TableService', 'SessionDataService', '$scope'];

    constructor(
        private fileResource: FileResource,
        private tableService: TableService,
        private sessionDataService: SessionDataService,
        private $scope: ng.IScopeService) {

        this.init();
    }

    unremovableColumns = [ 'sample', 'original_name', 'dataset', 'column'];

    init() {
        this.$scope.$watch(() => this.datasets, () => {
            if (this.datasets.length > 0) {
                this.updateViewLater();
            }
        }, true);
        /*
        // destroy the isolated scope when the element is removed to get rid of $watch listeners
        element.on('$destroy', function () {
            $scope.$destroy();
        });*/

        this.updateView();
    }

    getSettings(array, headers) {
        return {
            data: array,
            colHeaders: headers,
            columnSorting: true,
            manualColumnResize: true,
            sortIndicator: true,

            afterGetColHeader: (col, TH) => {
                if (this.unremovableColumns.indexOf(headers[col]) !== -1) {
                    // removal not allowed
                    return;
                }
                this.createRemoveButton(col, TH);
            },

            afterChange: (changes, source) => {
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
                    this.latestEdit = new Date().getTime();
                    this.updateDatasets(false);
                }
            }
        }
    }

    createRemoveButton(col, TH) {
        var button = document.createElement('A');
        button.className = 'btn btn-xs pull-right phenodata-header-button';
        var span = document.createElement('SPAN');
        span.className = 'glyphicon glyphicon-remove';
        button.appendChild(span);

        Handsontable.Dom.addEvent(button, 'click', () => {
            this.removeColumn(col);
        });

        if (TH.firstChild.lastChild.nodeName === 'A') {
            TH.firstChild.removeChild(TH.firstChild.lastChild);
        }
        TH.firstChild.appendChild(button);
    }

    addColumn() {
        var colHeaders = this.hot.getSettings().colHeaders;
        this.hot.alter('insert_col', colHeaders.length);
        // remove undefined column header
        colHeaders.pop();
        colHeaders.push(this.colName);
        this.hot.updateSettings( {
           colHeaders: colHeaders
        });
        this.colName = '';

        this.updateDatasets(false);
    }

    removeColumn(index) {
        this.hot.alter('remove_col', index);

        this.updateDatasets(false);
    }

    reset() {

        angular.forEach(this.datasets, (dataset) => {
            if (Utils.getFileExtension(dataset.name) === 'tsv') {
                this.resetTsv(dataset);
            } else {
                this.resetGenericFile(dataset);
            }
        });
    }

    resetTsv(dataset) {

        this.tableService.getColumns(this.sessionId, dataset.datasetId).then((fileHeaders) => {
            var metadata = [];

            var chipHeaders = fileHeaders.filter( function(header) {
                return Utils.startsWith(header, 'chip.');
            });

            angular.forEach(chipHeaders, function(fileHeader) {
                var entry = {
                    column: fileHeader,
                    key: 'sample',
                    value: fileHeader.replace('chip.', '')
                };
                metadata.push(entry);
            });

            dataset.metadata = metadata;

            this.updateView();
            this.updateDatasets(true);
        });
    }

    resetGenericFile(dataset) {

        dataset.metadata = [{
            column: null,
            key: 'sample',
            value: dataset.name
        }];

        this.updateView();
        this.updateDatasets(true);
    }

    remove () {
        angular.forEach(this.datasets, function(dataset) {
            dataset.metadata = null;
        });

        this.updateView();
        this.updateDatasets(true);
    }

    getHeaders(datasets) {
        // collect all headers
        var headers = {
            dataset: true,
            column: true
        };
        angular.forEach(datasets, function(dataset) {
            angular.forEach(dataset.metadata, function(entry) {
                headers[entry.key] = true;
            });
        });
        return Object.keys(headers);
    }

    getRows(datasets, headers) {

        var array = [];

        // get the row of a specific dataset and column if it exists already
        // or create a new row
        function getRow(dataset, column) {
            // find the existing row
            for (var i = 0; i < array.length; i++) {
                if (array[i].datasetId === dataset.datasetId && array[i].columnName === column) {
                    return array[i];
                }
            }

            // create a new row
            // fill the row with undefined values
            var row = Array.apply(null, new Array(headers.length)).map(function () {return undefined});

            // store datasetId and columnName as properties to hide them from the table
            row.datasetId = dataset.datasetId;
            row.columnName = column;
            row[0] = dataset.name;
            row[1] = column;
            array.push(row);

            return row;
        }

        angular.forEach(datasets, function(dataset) {

            angular.forEach(dataset.metadata, function(entry) {
                var row = getRow(dataset, entry.column);
                row[headers.indexOf(entry.key)] = entry.value;
            });
        });
        return array;
    }

    updateDatasets(updateAll) {

        var metadataMap = {};
        var array = this.array;
        var headers = this.headers;

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

        angular.forEach(this.datasets, (dataset) => {
            var newMetadata = metadataMap[dataset.datasetId];
            if (updateAll || !angular.equals(newMetadata, dataset.metadata)) {
                dataset.metadata = newMetadata;
                this.sessionDataService.updateDataset(dataset);
            }
        });
    }

    updateView() {

        var headers = this.getHeaders(this.datasets);
        var array = this.getRows(this.datasets, headers);

        if (!angular.equals(headers, this.headers)) {
            this.headers = headers;

            // remove old table if this is an update
            var container = document.getElementById('tableContainer');
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }

            this.hot = new Handsontable(container, this.getSettings(this.array, this.headers));

        }

        this.array = array;
        this.hot.loadData(this.array);
    }

    isEditingNow() {
        return new Date().getTime() - this.latestEdit < 1000;
    }

    updateViewLater() {

        if (!this.isEditingNow()) {
            this.updateView();

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

            if (!this.deferredUpdatesTimer) {
                this.deferredUpdatesTimer = setInterval(() => {
                    if (!this.isEditingNow()) {
                        clearInterval(this.deferredUpdatesTimer);
                        this.deferredUpdatesTimer = undefined;
                        this.updateView();
                    }
                }, 100);
            }
        }
    }
}

export default {
    controller: PhenodataVisualizationController,
    templateUrl: 'app/views/sessions/session/visualization/phenodata/phenodatavisualization.html',
    bindings: {
        datasets: '=selectedDatasets',
        datasetId: '=',
        sessionId: '=',
        src: '='
    }
}
