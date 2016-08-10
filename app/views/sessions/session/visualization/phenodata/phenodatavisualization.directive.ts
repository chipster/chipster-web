import Utils from "../../../../../services/utils.service";
import Dataset from "../../../../../model/session/dataset";
import TableService from "../../../../../services/tableservice.factory";
import SessionDataService from "../../sessiondata.service";
import MetadataEntry from "../../../../../model/session/metadataentry";

class Row extends Array<string> {
    // store datasetId and columnName as properties to hide them from the table
    constructor(length: number, public datasetId: string, public columnName: string) {
        super();
        for (let i = 0; i < length; i++) {
            this.push(undefined);
        }
    }
}

class PhenodataVisualizationController {

    static $inject = ['TableService', 'SessionDataService', '$scope'];

    constructor(
        private tableService: TableService,
        private sessionDataService: SessionDataService,
        private $scope: ng.IScopeService) {

        this.init();
    }

    datasets: Dataset[];
    sessionId: string;
    hot: any;
    // name of the new column
    colName: string;
    array: Row[];
    headers: string[];

    latestEdit: number;
    deferredUpdatesTimer: any;

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

    getSettings(array: string[][], headers: string[]) {
        return {
            data: array,
            colHeaders: headers,
            columnSorting: true,
            manualColumnResize: true,
            sortIndicator: true,

            afterGetColHeader: (col: number, TH: any) => {
                if (this.unremovableColumns.indexOf(headers[col]) !== -1) {
                    // removal not allowed
                    return;
                }
                this.createRemoveButton(col, TH);
            },

            afterChange: (changes: any, source: string) => {
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

    createRemoveButton(col: number, TH: any) {
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

    removeColumn(index: number) {
        this.hot.alter('remove_col', index);

        this.updateDatasets(false);
    }

    reset() {

        this.datasets.forEach((dataset: Dataset) => {
            if (Utils.getFileExtension(dataset.name) === 'tsv') {
                this.resetTsv(dataset);
            } else {
                this.resetGenericFile(dataset);
            }
        });
    }

    resetTsv(dataset: Dataset) {

        this.tableService.getColumns(this.sessionId, dataset.datasetId).then((fileHeaders: string[]) => {
            var metadata: MetadataEntry[] = [];

            var chipHeaders = fileHeaders.filter( function(header) {
                return Utils.startsWith(header, 'chip.');
            });

            chipHeaders.forEach((fileHeader) => {
                var entry = <MetadataEntry>{
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

    resetGenericFile(dataset: Dataset) {

        dataset.metadata = [{
            column: null,
            key: 'sample',
            value: dataset.name
        }];

        this.updateView();
        this.updateDatasets(true);
    }

    remove () {
        this.datasets.forEach((dataset: Dataset) => {
            dataset.metadata = null;
        });

        this.updateView();
        this.updateDatasets(true);
    }

    getHeaders(datasets: Dataset[]) {
        // collect all headers
        var headers = {
            dataset: true,
            column: true
        };
        datasets.forEach((dataset: Dataset) => {
            dataset.metadata.forEach((entry: MetadataEntry) => {
                headers[entry.key] = true;
            });
        });
        return Object.keys(headers);
    }

    getRows(datasets: Dataset[], headers: string[]) {

        var array: Row[] = [];

        // get the row of a specific dataset and column if it exists already
        // or create a new row
        function getRow(dataset: Dataset, column: string) {
            // find the existing row
            for (var i = 0; i < array.length; i++) {
                if (array[i].datasetId === dataset.datasetId && array[i].columnName === column) {
                    return array[i];
                }
            }

            // create a new row
            // fill the row with undefined values
            var row = new Row(headers.length, dataset.datasetId, column);
            row[0] = dataset.name;
            row[1] = column;
            array.push(row);

            return row;
        }

        datasets.forEach((dataset: Dataset) => {

            dataset.metadata.forEach((entry: MetadataEntry) => {
                var row = getRow(dataset, entry.column);
                row[headers.indexOf(entry.key)] = entry.value;
            });
        });
        return array;
    }

    updateDatasets(updateAll: boolean) {

        var metadataMap = new Map<string, MetadataEntry[]>();
        var array = this.array;
        var headers = this.headers;

        array.forEach((row: Row) => {

            for (var i = 0; i < headers.length; i++) {
                var entry = {
                    column: row.columnName,
                    key: headers[i],
                    value: row[i]
                };

                if (!metadataMap.has(row.datasetId)) {
                    metadataMap.set(row.datasetId, []);
                }

                metadataMap.get(row.datasetId).push(entry);
            }
        });

        this.datasets.forEach((dataset: Dataset) => {
            var newMetadata = metadataMap.get(dataset.datasetId);
            if (updateAll || !angular.equals(newMetadata, dataset.metadata)) {
                dataset.metadata = newMetadata;
                this.sessionDataService.updateDataset(dataset);
            }
        });
    }

    updateView() {

        if (this.datasets) {
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
        sessionId: '=',
    }
}
