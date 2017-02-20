var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import Tool from "../../../../../model/session/tool";
import { ToolService } from "../tool.service";
import Module from "../../../../../model/session/module";
import Category from "../../../../../model/session/category";
import SessionDataService from "../../sessiondata.service";
import { Observable } from "rxjs/Rx";
import { TSVReader } from "../../../../../shared/services/TSVReader";
import * as _ from "lodash";
import { Component, ViewChild, ElementRef, Input } from "@angular/core";
import { ModulePipe } from "../../../../../shared/pipes/modulepipe.pipe";
import { PipeService } from "../../../../../shared/services/pipeservice.service";
import { CategoryPipe } from "../../../../../shared/pipes/categorypipe.pipe";
import { ToolPipe } from "../../../../../shared/pipes/toolpipe.pipe";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
export var ToolsModalComponent = (function () {
    function ToolsModalComponent(toolService, tsvReader, sessionDataService, pipeService, ngbModal) {
        this.toolService = toolService;
        this.tsvReader = tsvReader;
        this.sessionDataService = sessionDataService;
        this.pipeService = pipeService;
        this.ngbModal = ngbModal;
        this.modules = [];
        this.tools = [];
        this.inputBindings = [];
        this.selectedDatasets = [];
    }
    ToolsModalComponent.prototype.ngOnInit = function () {
        // trigger parameter validation
        if (this.selectedTool) {
            this.selectTool(this.selectedTool);
        }
        if (!this.selectedModule) {
            this.selectModule(this.modules[0]);
            this.selectCategory(this.selectedModule.categories[0]);
        }
    };
    ToolsModalComponent.prototype.selectModule = function (module) {
        this.selectedModule = module;
        this.selectFirstVisible();
    };
    //defines which tool category the user have selected
    ToolsModalComponent.prototype.selectCategory = function (category) {
        this.selectedCategory = category;
    };
    ToolsModalComponent.prototype.selectFirstVisible = function () {
        var filteredModules = new ModulePipe(this.pipeService).transform(this.modules, this.searchTool);
        if (filteredModules && filteredModules.indexOf(this.selectedModule) < 0 && filteredModules[0]) {
            this.selectModule(filteredModules[0]);
        }
        var filteredCategories = new CategoryPipe(this.pipeService).transform(this.selectedModule.categories, this.searchTool);
        if (filteredCategories && filteredCategories.indexOf(this.selectedCategory) < 0 && filteredCategories[0]) {
            this.selectCategory(filteredCategories[0]);
        }
    };
    ToolsModalComponent.prototype.selectTool = function (tool) {
        this.selectedTool = tool;
        // TODO reset col_sel and metacol_sel if selected dataset has changed
        for (var _i = 0, _a = tool.parameters; _i < _a.length; _i++) {
            var param = _a[_i];
            this.populateParameterValues(param);
        }
        this.inputBindings = this.toolService.bindInputs(this.selectedTool, this.selectedDatasets);
    };
    ToolsModalComponent.prototype.toolSearchKeyEvent = function (e) {
        if (e.keyCode == 13) {
            // select the first result
            var visibleTools = new ToolPipe(this.pipeService).transform(this.selectedCategory.tools, this.searchTool);
            if (visibleTools[0]) {
                this.searchTool = null;
                // this.selectTool(visibleTools[0].name.id);
                this.selectTool(visibleTools[0]);
            }
        }
        if (e.keyCode == 27) {
            // clear the search
            this.searchTool = null;
        }
    };
    ToolsModalComponent.prototype.isRunEnabled = function () {
        // TODO add mandatory parameters check
        // either bindings ok or tool without inputs
        return this.inputBindings ||
            (this.selectedTool && (!this.selectedTool.inputs || this.selectedTool.inputs.length === 0));
    };
    ToolsModalComponent.prototype.setDescription = function (description) {
        this.parameterDescription = description;
    };
    ;
    ToolsModalComponent.prototype.setInputDescription = function (description) {
        this.inputDescription = description;
    };
    ToolsModalComponent.prototype.runJob = function () {
        this.close(true);
    };
    ;
    ToolsModalComponent.prototype.close = function (run) {
        // this.$uibModalInstance.close({
        //   selectedTool: this.selectedTool,
        //   selectedCategory: this.selectedCategory,
        //   selectedModule: this.selectedModule,
        //   inputBindings: this.inputBindings,
        //   run: run
        // });
    };
    ;
    ToolsModalComponent.prototype.dismiss = function () {
        // this.$uibModalInstance.dismiss();
    };
    ;
    ToolsModalComponent.prototype.openInputsModal = function () {
        // let modalInstance = this.$uibModal.open({
        //   animation: true,
        //   templateUrl: '../inputsmodal/inputsmodal.html',
        //   controller: 'InputsModalController',
        //   controllerAs: 'vm',
        //   bindToController: true,
        //   size: 'lg',
        //   resolve: {
        //
        //     selectedTool: () => {
        //       return _.cloneDeep(this.selectedTool);
        //     },
        //     moduleName: () => {
        //       return this.selectedModule.name;
        //     },
        //     categoryName: () => {
        //       return this.selectedCategory.name;
        //     },
        //     inputBindings: () => {
        //       return this.inputBindings;
        //     },
        //     selectedDatasets: () => {
        //       return _.cloneDeep(this.selectedDatasets);
        //     }
        //   }
        // });
        // modalInstance.result.then((result: any) => {
        //   this.inputBindings = result.inputBindings;
        //
        // }, function () {
        //   modal dismissed
        // });
    };
    // TODO move to service?
    ToolsModalComponent.prototype.getDatasetHeaders = function () {
        var _this = this;
        return this.selectedDatasets.map(function (dataset) { return _this.tsvReader.getTSVFile(_this.sessionDataService.getSessionId(), dataset.datasetId); });
    };
    // TODO move to service?
    ToolsModalComponent.prototype.populateParameterValues = function (parameter) {
        var _this = this;
        if (!parameter.value) {
            parameter.value = this.toolService.getDefaultValue(parameter);
        }
        if (parameter.type === 'COLUMN_SEL') {
            Observable.forkJoin(this.getDatasetHeaders()).subscribe(function (tsvFiles) {
                var columns = _.uniq(_.flatten(tsvFiles.map(function (tsvFile) { return tsvFile.headers.headers; })));
                parameter.selectionOptions = columns.map(function (column) {
                    return { id: column };
                });
                // reset value to empty if previous or default value is now invalid
                if (parameter.value && !_this.selectionOptionsContains(parameter.selectionOptions, parameter.value)) {
                    parameter.value = '';
                }
            });
        }
        // TODO reset value to empty if previous or default value is now invalid
        if (parameter.type === 'METACOLUMN_SEL') {
            parameter.selectionOptions = this.getMetadataColumns().map(function (column) {
                return { id: column };
            });
        }
    };
    // TODO move to service
    ToolsModalComponent.prototype.getMetadataColumns = function () {
        var keySet = new Set();
        for (var _i = 0, _a = this.selectedDatasets; _i < _a.length; _i++) {
            var dataset = _a[_i];
            for (var _b = 0, _c = dataset.metadata; _b < _c.length; _b++) {
                var entry = _c[_b];
                keySet.add(entry.key);
            }
        }
        return Array.from(keySet);
    };
    ToolsModalComponent.prototype.selectionOptionsContains = function (options, value) {
        for (var _i = 0, options_1 = options; _i < options_1.length; _i++) {
            var option = options_1[_i];
            if (value === option.id) {
                return true;
            }
        }
        return false;
    };
    ToolsModalComponent.prototype.openToolsModal = function () {
        this.toolsModalRef = this.ngbModal.open(this.toolsModalTemplate, { size: 'lg' });
        // var modalInstance = this.$uibModal.open({
        //     animation: true,
        //     templateUrl: './toolsmodal/toolsmodal.html',
        //     controller: 'ToolsModalController',
        //     controllerAs: 'vm',
        //     bindToController: true,
        //     size: 'lg',
        //     resolve: {
        //         selectedTool: () => {
        //             return this.selectedTool;
        //         },
        //         selectedCategory: () => {
        //             return this.selectedCategory;
        //         },
        //         selectedModule: () => {
        //             return this.selectedModule;
        //         },
        //         inputBindings: () => {
        //             return this.inputBindings;
        //         },
        //         selectedDatasets: () => {
        //             return _.cloneDeep(this.SelectionService.selectedDatasets);
        //         },
        //         isRunEnabled: () => {
        //             return this.isRunEnabled();
        //         },
        //         modules: () => {
        //             return this.modules;
        //         },
        //
        //         // TODO remove?
        //         tools: () => {
        //             return _.cloneDeep(this.tools);
        //         }
        //     }
        // });
        //
        // modalInstance.result.then((result: any) => {
        //     // save settings
        //     this.selectedTool = result.selectedTool;
        //     this.selectedCategory = result.selectedCategory;
        //     this.selectedModule = result.selectedModule;
        //     this.inputBindings = result.inputBindings;
        //
        //     if (result.run) {
        //         this.runJob();
        //     }
        // }, function () {
        //     // modal dismissed
        // });
    };
    __decorate([
        Input(), 
        __metadata('design:type', Array)
    ], ToolsModalComponent.prototype, "modules", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Array)
    ], ToolsModalComponent.prototype, "tools", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Array)
    ], ToolsModalComponent.prototype, "inputBindings", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Array)
    ], ToolsModalComponent.prototype, "selectedDatasets", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Module)
    ], ToolsModalComponent.prototype, "selectedModule", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Category)
    ], ToolsModalComponent.prototype, "selectedCategory", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Tool)
    ], ToolsModalComponent.prototype, "selectedTool", void 0);
    __decorate([
        ViewChild('toolsModalTemplate'), 
        __metadata('design:type', ElementRef)
    ], ToolsModalComponent.prototype, "toolsModalTemplate", void 0);
    ToolsModalComponent = __decorate([
        Component({
            selector: 'ch-tools-modal',
            templateUrl: './toolsmodal.html',
            styleUrls: ['./toolsmodal.less']
        }), 
        __metadata('design:paramtypes', [ToolService, TSVReader, SessionDataService, PipeService, NgbModal])
    ], ToolsModalComponent);
    return ToolsModalComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/tools/toolsmodal/toolsmodal.component.js.map