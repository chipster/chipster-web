var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import SessionDataService from "../sessiondata.service";
import { ToolService } from "./tool.service";
import SelectionService from "../selection.service";
import Utils from "../../../../shared/utilities/utils";
import * as _ from "lodash";
import { Component, Input } from "@angular/core";
export var ToolBoxComponent = (function () {
    function ToolBoxComponent(ToolService, SessionDataService, SelectionService) {
        this.ToolService = ToolService;
        this.SessionDataService = SessionDataService;
        this.SelectionService = SelectionService;
        //initialization
        this.selectedModule = null;
        this.selectedCategory = null;
        this.selectedTool = null;
        this.selectedDatasets = [];
        this.inputBindings = null;
    }
    ToolBoxComponent.prototype.ngOnInit = function () {
        this.modules = _.cloneDeep(this.modules);
        this.selectedDatasets = this.SelectionService.selectedDatasets;
        // TODO do bindings for tools with no inputs?
    };
    // watch for data selection changes
    ToolBoxComponent.prototype.ngDoCheck = function () {
        if (this.selectedDatasets && (this.selectedDatasets.length !== this.SelectionService.selectedDatasets.length ||
            !Utils.equalStringArrays(Utils.getDatasetIds(this.selectedDatasets), Utils.getDatasetIds(this.SelectionService.selectedDatasets)))) {
            // save for comparison
            this.selectedDatasets = _.cloneDeep(this.SelectionService.selectedDatasets);
            // bind if tool selected
            if (this.selectedTool) {
                console.info("dataset selection changed -> binding inputs");
                this.inputBindings = this.ToolService.bindInputs(this.selectedTool, this.SelectionService.selectedDatasets);
            }
        }
    };
    ToolBoxComponent.prototype.isRunEnabled = function () {
        // TODO add mandatory parameters check
        // either bindings ok or tool without inputs
        return this.inputBindings ||
            (this.selectedTool && (!this.selectedTool.inputs || this.selectedTool.inputs.length === 0));
    };
    // Method for submitting a job
    ToolBoxComponent.prototype.runJob = function () {
        // create job
        var job = {
            toolId: this.selectedTool.name.id,
            toolCategory: this.selectedCategory.name,
            toolName: this.selectedTool.name.displayName,
            toolDescription: this.selectedTool.description,
            state: 'NEW',
        };
        // set parameters
        job.parameters = [];
        for (var _i = 0, _a = this.selectedTool.parameters; _i < _a.length; _i++) {
            var toolParam = _a[_i];
            job.parameters.push({
                parameterId: toolParam.name.id,
                displayName: toolParam.name.displayName,
                description: toolParam.description,
                type: toolParam.type,
                value: toolParam.value
            });
        }
        // set inputs
        job.inputs = [];
        // TODO bindings done already?
        if (!this.inputBindings) {
            console.warn("no input bindings before running a job, binding now");
            this.inputBindings = this.ToolService.bindInputs(this.selectedTool, this.SelectionService.selectedDatasets);
        }
        for (var _b = 0, _c = this.inputBindings; _b < _c.length; _b++) {
            var inputBinding = _c[_b];
            // single input
            if (!this.ToolService.isMultiInput(inputBinding.toolInput)) {
                job.inputs.push({
                    inputId: inputBinding.toolInput.name.id,
                    description: inputBinding.toolInput.description,
                    datasetId: inputBinding.datasets[0].datasetId,
                    displayName: inputBinding.datasets[0].name
                });
            }
            else {
                var i = 0;
                for (var _d = 0, _e = inputBinding.datasets; _d < _e.length; _d++) {
                    var dataset = _e[_d];
                    job.inputs.push({
                        inputId: this.ToolService.getMultiInputId(inputBinding.toolInput, i),
                        description: inputBinding.toolInput.description,
                        datasetId: dataset.datasetId,
                        displayName: dataset.name
                    });
                    i++;
                }
            }
        }
        // runsys
        this.SessionDataService.createJob(job);
    };
    __decorate([
        Input(), 
        __metadata('design:type', Array)
    ], ToolBoxComponent.prototype, "modules", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Array)
    ], ToolBoxComponent.prototype, "tools", void 0);
    ToolBoxComponent = __decorate([
        Component({
            selector: 'ch-toolbox',
            templateUrl: './tools.html'
        }), 
        __metadata('design:paramtypes', [ToolService, SessionDataService, SelectionService])
    ], ToolBoxComponent);
    return ToolBoxComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/tools/toolbox.component.js.map