var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import SelectionService from "../selection.service";
import Utils from "../../../../shared/utilities/utils";
import * as _ from "lodash";
import visualizations from "./visualizationconstants";
import { Component, ChangeDetectorRef } from "@angular/core";
export var VisualizationsComponent = (function () {
    function VisualizationsComponent(SelectionService, changeDetectorRef) {
        this.SelectionService = SelectionService;
        this.changeDetectorRef = changeDetectorRef;
        this.visualizations = visualizations;
    }
    VisualizationsComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.active = this.getTabId(_.first(this.getPossibleVisualizations()));
        this.datasetSelectionSubscription = this.SelectionService.getDatasetSelectionStream().subscribe(function () {
            _this.active = _this.getTabId(_.first(_this.getPossibleVisualizations()));
            //this.changeDetectorRef.detectChanges(); // needed to trigger tab content update
        });
    };
    VisualizationsComponent.prototype.ngOnDestroy = function () {
        this.datasetSelectionSubscription.unsubscribe();
    };
    VisualizationsComponent.prototype.isCompatibleVisualization = function (name) {
        var visualization = _.find(this.visualizations, function (visualization) { return visualization.id === name; });
        var datasetSelectionCount = this.SelectionService.selectedDatasets.length;
        return this.containsExtension(visualization.extensions) && (visualization.anyInputCountSupported || _.includes(visualization.supportedInputFileCounts, datasetSelectionCount));
    };
    VisualizationsComponent.prototype.containsExtension = function (extensions) {
        return _.every(this.SelectionService.selectedDatasets, function (dataset) {
            return _.includes(extensions, Utils.getFileExtension(dataset.name));
        });
    };
    VisualizationsComponent.prototype.getPossibleVisualizations = function () {
        var datasetFileExtensions = _.map(this.SelectionService.selectedDatasets, function (dataset) {
            return Utils.getFileExtension(dataset.name);
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
    VisualizationsComponent.prototype.tabChange = function (event) {
        this.active = event.nextId;
    };
    //noinspection JSMethodCanBeStatic
    /**
     * Not static since used also from template
     * @param visId
     * @returns {string}
     */
    VisualizationsComponent.prototype.getTabId = function (visId) {
        return visId ? VisualizationsComponent.TAB_ID_PREFIX + visId : undefined;
    };
    VisualizationsComponent.TAB_ID_PREFIX = 'ch-vis-tab-';
    VisualizationsComponent = __decorate([
        Component({
            selector: 'ch-visualizations',
            templateUrl: './visualizations.html'
        }), 
        __metadata('design:paramtypes', [SelectionService, ChangeDetectorRef])
    ], VisualizationsComponent);
    return VisualizationsComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/visualizationbox.component.js.map