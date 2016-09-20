import Utils from "../../../../../services/utils.service";
import Dataset from "../../../../../model/session/dataset";
import CSVReader from "../../../../../services/csv/CSVReader";
import SessionDataService from "../../sessiondata.service";
import MetadataEntry from "../../../../../model/session/metadataentry";

interface Row extends Array<string> {
    // store datasetId and columnName as properties to hide them from the table
    datasetId: string;
    columnName: string;
}

class PhenodataVisualizationController {

    static $inject = ['CSVReader', 'SessionDataService', '$scope'];

    constructor(
        private CSVReader: CSVReader,
        private sessionDataService: SessionDataService,
        private $scope: ng.IScope) {
        this.init();
    }

    datasets: Dataset[];
    hot: ht.Methods;
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

        (<any>Handsontable).Dom.addEvent(button, 'click', () => {
            this.removeColumn(col);
        });

        if (TH.firstChild.lastChild.nodeName === 'A') {
            TH.firstChild.removeChild(TH.firstChild.lastChild);
        }
        TH.firstChild.appendChild(button);
    }

    addColumn() {
        var colHeaders = <Array<string>>(<ht.Options>this.hot.getSettings()).colHeaders;
        this.hot.alter('insert_col', colHeaders.length);
        // remove undefined column header
        colHeaders.pop();
        colHeaders.push(this.colName);
        this.hot.updateSettings({
           colHeaders: colHeaders
        }, false);
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

        this.CSVReader.getColumns(this.sessionDataService.getSessionId(), dataset.datasetId).then((fileHeaders: string[]) => {
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
            if (dataset.metadata) {
                dataset.metadata.forEach((entry: MetadataEntry) => {
                    headers[entry.key] = true;
                });
            }
        });
        return Object.keys(headers);
    }

    createRow(length: number, datasetId: string, columnName: string) {
        // create a plain JS array, because Handsontable doesn't recognize typescript Array
        // and doesn't allow columns to be added on object data source
        let row = <Row>[];
         for (let i = 0; i < length; i++) {
            row.push(undefined);
         }
         row.datasetId = datasetId;
         row.columnName = columnName;

        return row;
    }

    // get the row of a specific dataset and column if it exists already
    // or create a new row
    getRow(dataset: Dataset, column: string, array: Row[], headers: string[]) {
        // find the existing row
        for (var i = 0; i < array.length; i++) {
            if (array[i].datasetId === dataset.datasetId && array[i].columnName === column) {
                return array[i];
            }
        }

        // create a new row
        // fill the row with undefined values
        var row = this.createRow(headers.length, dataset.datasetId, column);

        row[0] = dataset.name;
        row[1] = column;

        return row;
    }

    getRows(datasets: Dataset[], headers: string[]) {

        var array: Row[] = [];

        datasets.forEach((dataset: Dataset) => {
            if (dataset.metadata) {
                if (dataset.metadata.length > 0) {
                    dataset.metadata.forEach((entry: MetadataEntry) => {
                        var row = this.getRow(dataset, entry.column, array, headers);
                        row[headers.indexOf(entry.key)] = entry.value;
                        if (array.indexOf(row) === -1) {
                            array.push(row);
                        }
                    });
                } else {
                    var row = this.getRow(dataset, null, array, headers);
                    array.push(row);
                }
            }
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

                this.hot = new Handsontable(container, this.getSettings(array, this.headers));

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
    templateUrl: 'views/sessions/session/visualization/phenodata/phenodatavisualization.html',
    bindings: {
        datasets: '=selectedDatasets'
    }
}
