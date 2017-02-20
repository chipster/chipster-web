var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import Utils from "../../../../../shared/utilities/utils";
import SessionDataService from "../../sessiondata.service";
import * as _ from "lodash";
import { Component, Input } from "@angular/core";
import FileResource from "../../../../../shared/resources/fileresource";
export var PhenodataVisualizationComponent = (function () {
    function PhenodataVisualizationComponent(sessionDataService, fileResource) {
        this.sessionDataService = sessionDataService;
        this.fileResource = fileResource;
        this.unremovableColumns = ['sample', 'original_name', 'dataset', 'column'];
    }
    PhenodataVisualizationComponent.prototype.ngOnInit = function () {
        this.updateView();
    };
    PhenodataVisualizationComponent.prototype.ngOnChanges = function (changes) {
        for (var propName in changes) {
            if (propName === 'datasets') {
                if (this.datasets.length > 0) {
                    this.updateViewLater();
                }
            }
        }
    };
    PhenodataVisualizationComponent.prototype.getSettings = function (array, headers) {
        var _this = this;
        return {
            data: array,
            colHeaders: headers,
            columnSorting: true,
            manualColumnResize: true,
            sortIndicator: true,
            afterGetColHeader: function (col, TH) {
                if (_this.unremovableColumns.indexOf(headers[col]) !== -1) {
                    // removal not allowed
                    return;
                }
                _this.createRemoveButton(col, TH);
            },
            afterChange: function (changes, source) {
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
                    _this.latestEdit = new Date().getTime();
                    _this.updateDatasets(false);
                }
            }
        };
    };
    PhenodataVisualizationComponent.prototype.createRemoveButton = function (col, TH) {
        var _this = this;
        var button = document.createElement('A');
        button.className = 'btn btn-xs pull-right phenodata-header-button';
        var span = document.createElement('SPAN');
        span.className = 'glyphicon glyphicon-remove';
        button.appendChild(span);
        Handsontable.Dom.addEvent(button, 'click', function () {
            _this.removeColumn(col);
        });
        if (TH.firstChild.lastChild.nodeName === 'A') {
            TH.firstChild.removeChild(TH.firstChild.lastChild);
        }
        TH.firstChild.appendChild(button);
    };
    PhenodataVisualizationComponent.prototype.removeColumn = function (index) {
        this.hot.alter('remove_col', index);
        this.updateDatasets(false);
    };
    PhenodataVisualizationComponent.prototype.resetTsv = function (dataset) {
        var _this = this;
        this.fileResource.getData(this.sessionDataService.getSessionId(), dataset.datasetId).subscribe(function (fileHeaders) {
            var metadata = [];
            var chipHeaders = fileHeaders.filter(function (header) {
                return Utils.startsWith(header, 'chip.');
            });
            chipHeaders.forEach(function (fileHeader) {
                var entry = {
                    column: fileHeader,
                    key: 'sample',
                    value: fileHeader.replace('chip.', '')
                };
                metadata.push(entry);
            });
            dataset.metadata = metadata;
            _this.updateView();
            _this.updateDatasets(true);
        });
    };
    PhenodataVisualizationComponent.prototype.resetGenericFile = function (dataset) {
        dataset.metadata = [{
                column: null,
                key: 'sample',
                value: dataset.name
            }];
        this.updateView();
        this.updateDatasets(true);
    };
    PhenodataVisualizationComponent.prototype.getHeaders = function (datasets) {
        // collect all headers
        var headers = {
            dataset: true,
            column: true
        };
        datasets.forEach(function (dataset) {
            if (dataset.metadata) {
                dataset.metadata.forEach(function (entry) {
                    headers[entry.key] = true;
                });
            }
        });
        return Object.keys(headers);
    };
    PhenodataVisualizationComponent.prototype.createRow = function (length, datasetId, columnName) {
        // create a plain JS array, because Handsontable doesn't recognize typescript Array
        // and doesn't allow columns to be added on object data source
        var row = [];
        for (var i = 0; i < length; i++) {
            row.push(undefined);
        }
        row.datasetId = datasetId;
        row.columnName = columnName;
        return row;
    };
    // get the row of a specific dataset and column if it exists already
    // or create a new row
    PhenodataVisualizationComponent.prototype.getRow = function (dataset, column, array, headers) {
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
    };
    PhenodataVisualizationComponent.prototype.getRows = function (datasets, headers) {
        var _this = this;
        var array = [];
        datasets.forEach(function (dataset) {
            if (dataset.metadata) {
                if (dataset.metadata.length > 0) {
                    dataset.metadata.forEach(function (entry) {
                        var row = _this.getRow(dataset, entry.column, array, headers);
                        row[headers.indexOf(entry.key)] = entry.value;
                        if (array.indexOf(row) === -1) {
                            array.push(row);
                        }
                    });
                }
                else {
                    var row = _this.getRow(dataset, null, array, headers);
                    array.push(row);
                }
            }
        });
        return array;
    };
    PhenodataVisualizationComponent.prototype.updateDatasets = function (updateAll) {
        var _this = this;
        var metadataMap = new Map();
        var array = this.array;
        var headers = this.headers;
        array.forEach(function (row) {
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
        this.datasets.forEach(function (dataset) {
            var newMetadata = metadataMap.get(dataset.datasetId);
            if (updateAll || !_.isEqual(newMetadata, dataset.metadata)) {
                dataset.metadata = newMetadata;
                _this.sessionDataService.updateDataset(dataset);
            }
        });
    };
    PhenodataVisualizationComponent.prototype.updateView = function () {
        if (this.datasets) {
            var headers = this.getHeaders(this.datasets);
            var array = this.getRows(this.datasets, headers);
            if (!_.isEqual(headers, this.headers)) {
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
    };
    PhenodataVisualizationComponent.prototype.isEditingNow = function () {
        return new Date().getTime() - this.latestEdit < 1000;
    };
    PhenodataVisualizationComponent.prototype.updateViewLater = function () {
        var _this = this;
        if (!this.isEditingNow()) {
            this.updateView();
        }
        else {
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
                this.deferredUpdatesTimer = setInterval(function () {
                    if (!_this.isEditingNow()) {
                        clearInterval(_this.deferredUpdatesTimer);
                        _this.deferredUpdatesTimer = undefined;
                        _this.updateView();
                    }
                }, 100);
            }
        }
    };
    PhenodataVisualizationComponent.prototype.addColumnModal = function () {
        // var modalInstance = this.$uibModal.open({
        //     animation: true,
        //     templateUrl: './addcolumn.html',
        //     controller: 'AddColumnController',
        //     controllerAs: '$ctrl',
        //     bindToController: true,
        //     size: 'lg',
        //     resolve: {
        //         hot: () => this.hot,
        //         colName: () => this.colName,
        //         datasets: () => this.datasets
        //     }
        // });
        //
        // modalInstance.result.then((result: any) => {
        //     if(result === 'update') {
        //         this.updateDatasets(false);
        //     }
        // }, function () {
        //     // modal dismissed
        // });
    };
    __decorate([
        Input(), 
        __metadata('design:type', Array)
    ], PhenodataVisualizationComponent.prototype, "datasets", void 0);
    PhenodataVisualizationComponent = __decorate([
        Component({
            selector: 'ch-phenodata-visualization',
            templateUrl: './phenodatavisualization.html'
        }), 
        __metadata('design:paramtypes', [SessionDataService, FileResource])
    ], PhenodataVisualizationComponent);
    return PhenodataVisualizationComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/phenodata/phenodatavisualization.component.js.map