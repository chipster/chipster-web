"use strict";
var utils_service_1 = require("../../../../services/utils.service");
var _ = require("lodash");
var visualizationconstants_1 = require("./visualizationconstants");
var VisualizationBoxComponent = (function () {
    function VisualizationBoxComponent(SelectionService, SessionDataService, $timeout) {
        this.SelectionService = SelectionService;
        this.SessionDataService = SessionDataService;
        this.$timeout = $timeout;
        this.visualizations = visualizationconstants_1.default;
    }
    VisualizationBoxComponent.prototype.$onInit = function () {
        this.datasets = [];
        this.active = _.first(this.getPossibleVisualizations());
    };
    VisualizationBoxComponent.prototype.$doCheck = function () {
        var _this = this;
        if (!_.isEqual(this.datasets, this.SelectionService.selectedDatasets)) {
            this.active = undefined;
            this.datasets = _.cloneDeep(this.SelectionService.selectedDatasets);
            // set timeout with 0 forces removing tab content from dom
            // so that tab content will be drawn again. Otherwise tab-content
            // won't change since it's not listening dataset selection changes
            this.$timeout(function () {
                _this.active = _.first(_this.getPossibleVisualizations());
            }, 0);
        }
    };
    VisualizationBoxComponent.prototype.isCompatibleVisualization = function (name) {
        var visualization = _.find(this.visualizations, function (visualization) { return visualization.id === name; });
        var datasetSelectionCount = this.SelectionService.selectedDatasets.length;
        return this.containsExtension(visualization.extensions) && (visualization.anyInputCountSupported || _.includes(visualization.supportedInputFileCounts, datasetSelectionCount));
    };
    VisualizationBoxComponent.prototype.containsExtension = function (extensions) {
        return _.every(this.SelectionService.selectedDatasets, function (dataset) {
            return _.includes(extensions, utils_service_1.default.getFileExtension(dataset.name));
        });
    };
    VisualizationBoxComponent.prototype.getPossibleVisualizations = function () {
        var datasetFileExtensions = _.map(this.SelectionService.selectedDatasets, function (dataset) {
            return utils_service_1.default.getFileExtension(dataset.name);
        });
        var selectionCount = datasetFileExtensions.length;
        var sameFileTypes = _.uniq(datasetFileExtensions).length === 1;
        return sameFileTypes ? _.chain(this.visualizations)
            .filter(function (visualization) { return _.some(visualization.extensions, function (extension) {
            var appropriateInputFileCount = (visualization.anyInputCountSupported || _.includes(visualization.supportedInputFileCounts, selectionCount));
            var visualizationSupportsFileType = _.includes(datasetFileExtensions, extension);
            return appropriateInputFileCount && visualizationSupportsFileType;
        }); })
            .map(function (item) { return item.id; })
            .value() : [];
    };
    return VisualizationBoxComponent;
}());
VisualizationBoxComponent.$inject = ['SelectionService', 'SessionDataService', '$timeout'];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    controller: VisualizationBoxComponent,
    templateUrl: 'app/views/sessions/session/visualization/visualization.html'
};
//# sourceMappingURL=visualizationbox.component.js.map