var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import UtilsService from "../../../shared/utilities/utils";
import * as _ from "lodash";
import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import SelectionEvent from "../../../model/events/selectionevent";
import { Action } from "../../../model/events/selectionevent";
var SelectionService = (function () {
    function SelectionService() {
        // selections
        this.selectedDatasets = [];
        this.selectedJobs = [];
        // tool selection
        this.selectedTool = null;
        this.selectedToolIndex = -1;
        this.istoolselected = false;
        this.datasetSelectionSubject$ = new Subject();
        this.jobSelectionSubject$ = new Subject();
        this.toolSelectionSubject$ = new Subject();
    }
    /**
     * Check if there are one or more dataset selected
     * @returns {boolean}
     */
    SelectionService.prototype.isDatasetSelected = function () {
        return this.selectedDatasets.length > 0;
    };
    /**
     * Check if there are one or more jobs selected
     * @returns {boolean}
     */
    SelectionService.prototype.isJobSelected = function () {
        return this.selectedJobs.length > 0;
    };
    /**
     * Check if given dataset is selected
     * @param data
     * @returns {boolean}
     */
    SelectionService.prototype.isSelectedDataset = function (data) {
        return this.selectedDatasets.indexOf(data) !== -1;
    };
    /**
     * Check if given job is selected
     * @param data
     * @returns {boolean}
     */
    SelectionService.prototype.isSelectedJob = function (data) {
        return this.selectedJobs.indexOf(data) !== -1;
    };
    /**
     * Check if single dataset is selected
     * @returns {boolean}
     */
    SelectionService.prototype.isSingleDatasetSelected = function () {
        return this.selectedDatasets.length == 1;
    };
    /**
     * Check if there are more than one datasets selected
     * @returns {boolean}
     */
    SelectionService.prototype.isMultipleDatasetsSelected = function () {
        return this.selectedDatasets.length > 1;
    };
    SelectionService.prototype.toggleDatasetSelection = function ($event, data, allDatasets) {
        var _this = this;
        this.activeDatasetId = data.datasetId;
        var oldDatasets = _.clone(this.selectedDatasets);
        var oldIdsSet = new Set(this.selectedDatasets.map(function (dataset) { return dataset.datasetId; }));
        UtilsService.toggleSelection($event, data, allDatasets, this.selectedDatasets);
        this.selectedDatasets = _.clone(this.selectedDatasets); // clone array so that changes on it can be tracen in $onChanges-block
        var newIdsSet = new Set(this.selectedDatasets.map(function (dataset) { return dataset.datasetId; }));
        oldDatasets.filter(function (dataset) { return !newIdsSet.has(dataset.datasetId); }).forEach(function (dataset) {
            _this.datasetSelectionSubject$.next(new SelectionEvent(Action.Remove, dataset));
        });
        this.selectedDatasets.filter(function (dataset) { return !oldIdsSet.has(dataset.datasetId); }).forEach(function (dataset) {
            _this.datasetSelectionSubject$.next(new SelectionEvent(Action.Add, dataset));
        });
    };
    SelectionService.prototype.clearSelection = function () {
        var _this = this;
        var unselectedDatasets = _.clone(this.selectedDatasets);
        this.selectedDatasets.length = 0;
        // send events only after the array is cleared in case some component get's the latest
        // state from the service instead of the event
        unselectedDatasets.forEach(function (dataset) {
            _this.datasetSelectionSubject$.next(new SelectionEvent(Action.Remove, dataset));
        });
        var unselectedJobs = _.clone(this.selectedJobs);
        this.selectedJobs.length = 0;
        unselectedJobs.forEach(function (job) {
            _this.jobSelectionSubject$.next(new SelectionEvent(Action.Remove, job));
        });
    };
    SelectionService.prototype.selectJob = function (event, job) {
        this.clearSelection();
        this.selectedJobs = [job];
        this.jobSelectionSubject$.next(new SelectionEvent(Action.Add, job));
    };
    SelectionService.prototype.getDatasetSelectionStream = function () {
        // don't expose the subject directly
        return this.datasetSelectionSubject$.asObservable();
    };
    SelectionService.prototype.getJobSelectionStream = function () {
        // don't expose the subject directly
        return this.jobSelectionSubject$.asObservable();
    };
    SelectionService.prototype.setSelectedDatasets = function (datasets) {
        var _this = this;
        this.clearSelection();
        datasets.forEach(function (dataset) {
            _this.selectedDatasets.push(dataset);
            _this.datasetSelectionSubject$.next(new SelectionEvent(Action.Add, dataset));
        });
    };
    SelectionService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [])
    ], SelectionService);
    return SelectionService;
}());
export default SelectionService;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/selection.service.js.map