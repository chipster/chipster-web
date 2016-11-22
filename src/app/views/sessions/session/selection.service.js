"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var utils_service_1 = require("../../../services/utils.service");
var _ = require("lodash");
var core_1 = require("@angular/core");
var SelectionService = (function () {
    function SelectionService() {
        // selections
        this.selectedDatasets = [];
        this.selectedJobs = [];
        // tool selection
        this.selectedTool = null;
        this.selectedToolIndex = -1;
        this.istoolselected = false;
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
        this.activeDatasetId = data.datasetId;
        utils_service_1.default.toggleSelection($event, data, allDatasets, this.selectedDatasets);
        this.selectedDatasets = _.clone(this.selectedDatasets); // clone array so that changes on it can be tracen in $onChanges-block
    };
    SelectionService.prototype.clearSelection = function () {
        this.selectedDatasets.length = 0;
        this.selectedJobs.length = 0;
    };
    SelectionService.prototype.selectJob = function (event, job) {
        this.clearSelection();
        this.selectedJobs = [job];
    };
    return SelectionService;
}());
SelectionService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [])
], SelectionService);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SelectionService;
//# sourceMappingURL=selection.service.js.map