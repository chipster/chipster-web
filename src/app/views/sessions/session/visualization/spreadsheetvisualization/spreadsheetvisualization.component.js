"use strict";
var SpreadsheetVisualizationController = (function () {
    function SpreadsheetVisualizationController(sessionDataService, tsvReader) {
        this.sessionDataService = sessionDataService;
        this.tsvReader = tsvReader;
    }
    SpreadsheetVisualizationController.prototype.$onInit = function () {
        var _this = this;
        this.tsvReader.getTSV(this.sessionDataService.getSessionId(), this.datasetId).subscribe(function (result) {
            var parsedTSV = d3.tsv.parseRows(result.data);
            var container = document.getElementById('tableContainer');
            new Handsontable(container, _this.getSettings(parsedTSV));
        }, function (e) { return console.error('Fetching TSVData failed', e); });
    };
    SpreadsheetVisualizationController.prototype.getSettings = function (array) {
        return {
            data: array.slice(1),
            colHeaders: array[0],
            columnSorting: true,
            manualColumnResize: true,
            sortIndicator: true,
            readOnly: true
        };
    };
    return SpreadsheetVisualizationController;
}());
SpreadsheetVisualizationController.$inject = ['FileResource', 'SessionDataService', 'TSVReader'];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    controller: SpreadsheetVisualizationController,
    template: '<div id="tableContainer"></div>',
    bindings: {
        datasetId: '<'
    }
};
//# sourceMappingURL=spreadsheetvisualization.component.js.map