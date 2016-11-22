"use strict";
var Rx_1 = require("rxjs/Rx");
var _ = require("lodash");
var ToolsModalController = (function () {
    function ToolsModalController($uibModalInstance, $uibModal, $scope, $filter, $q, selectedTool, selectedCategory, selectedModule, inputBindings, selectedDatasets, toolService, tsvReader, sessionDataService, modules, tools) {
        this.$uibModalInstance = $uibModalInstance;
        this.$uibModal = $uibModal;
        this.$scope = $scope;
        this.$filter = $filter;
        this.$q = $q;
        this.selectedTool = selectedTool;
        this.selectedCategory = selectedCategory;
        this.selectedModule = selectedModule;
        this.inputBindings = inputBindings;
        this.selectedDatasets = selectedDatasets;
        this.toolService = toolService;
        this.tsvReader = tsvReader;
        this.sessionDataService = sessionDataService;
        this.modules = modules;
        this.tools = tools;
        // used by template
        this.isSelectionParameter = toolService.isSelectionParameter;
        this.isNumberParameter = toolService.isNumberParameter;
    }
    ToolsModalController.prototype.$onInit = function () {
        var _this = this;
        // catch dismiss and do close instead
        this.$scope.$on('modal.closing', function (event, reason, closed) {
            if (!closed) {
                event.preventDefault();
                _this.close(false);
            }
        });
        // trigger parameter validation
        if (this.selectedTool) {
            this.selectTool(this.selectedTool);
        }
        if (!this.selectedModule) {
            this.selectModule(this.modules[0]);
        }
    };
    ToolsModalController.prototype.selectModule = function (module) {
        this.selectedModule = module;
        this.selectFirstVisible();
    };
    //defines which tool category the user have selected
    ToolsModalController.prototype.selectCategory = function (category) {
        this.selectedCategory = category;
    };
    ToolsModalController.prototype.selectFirstVisible = function () {
        var filteredModules = this.$filter('moduleFilter')(this.modules, this.searchTool);
        if (filteredModules && filteredModules.indexOf(this.selectedModule) < 0 && filteredModules[0]) {
            this.selectModule(filteredModules[0]);
        }
        var filteredCategories = this.$filter('categoryFilter')(this.selectedModule.categories, this.searchTool);
        if (filteredCategories && filteredCategories.indexOf(this.selectedCategory) < 0 && filteredCategories[0]) {
            this.selectCategory(filteredCategories[0]);
        }
    };
    ToolsModalController.prototype.selectTool = function (tool) {
        this.selectedTool = tool;
        // TODO reset col_sel and metacol_sel if selected dataset has changed
        for (var _i = 0, _a = tool.parameters; _i < _a.length; _i++) {
            var param = _a[_i];
            this.populateParameterValues(param);
        }
        this.inputBindings = this.toolService.bindInputs(this.selectedTool, this.selectedDatasets);
    };
    ToolsModalController.prototype.toolSearchKeyEvent = function (e) {
        if (e.keyCode == 13) {
            // select the first result
            var visibleTools = this.$filter('toolFilter')(this.selectedCategory.tools, this.searchTool);
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
    ToolsModalController.prototype.isRunEnabled = function () {
        // TODO add mandatory parameters check
        // either bindings ok or tool without inputs
        return this.inputBindings ||
            (this.selectedTool && (!this.selectedTool.inputs || this.selectedTool.inputs.length === 0));
    };
    ToolsModalController.prototype.setDescription = function (description) {
        this.parameterDescription = description;
    };
    ;
    ToolsModalController.prototype.setInputDescription = function (description) {
        this.inputDescription = description;
    };
    ToolsModalController.prototype.runJob = function () {
        this.close(true);
    };
    ;
    ToolsModalController.prototype.close = function (run) {
        this.$uibModalInstance.close({
            selectedTool: this.selectedTool,
            selectedCategory: this.selectedCategory,
            selectedModule: this.selectedModule,
            inputBindings: this.inputBindings,
            run: run
        });
    };
    ;
    ToolsModalController.prototype.dismiss = function () {
        this.$uibModalInstance.dismiss();
    };
    ;
    ToolsModalController.prototype.openInputsModal = function () {
        var _this = this;
        var modalInstance = this.$uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/tools/inputsmodal/inputsmodal.html',
            controller: 'InputsModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                selectedTool: function () {
                    return _.cloneDeep(_this.selectedTool);
                },
                moduleName: function () {
                    return _this.selectedModule.name;
                },
                categoryName: function () {
                    return _this.selectedCategory.name;
                },
                inputBindings: function () {
                    return _this.inputBindings;
                },
                selectedDatasets: function () {
                    return _.cloneDeep(_this.selectedDatasets);
                }
            }
        });
        modalInstance.result.then(function (result) {
            _this.inputBindings = result.inputBindings;
        }, function () {
            // modal dismissed
        });
    };
    ToolsModalController.prototype.openSourceModal = function () {
        var _this = this;
        this.$uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/tools/sourcemodal/sourcemodal.html',
            controller: 'SourceModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                selectedTool: function () {
                    return _.cloneDeep(_this.selectedTool);
                },
                category: function () {
                    return _this.selectedCategory.name;
                },
                module: function () {
                    return _this.selectedModule.name;
                }
            }
        });
    };
    // TODO move to service?
    ToolsModalController.prototype.getDatasetHeaders = function () {
        var _this = this;
        return this.selectedDatasets.map(function (dataset) { return _this.tsvReader.getTSVFile(_this.sessionDataService.getSessionId(), dataset.datasetId); });
    };
    // TODO move to service?
    ToolsModalController.prototype.populateParameterValues = function (parameter) {
        var _this = this;
        if (!parameter.value) {
            parameter.value = this.toolService.getDefaultValue(parameter);
        }
        if (parameter.type === 'COLUMN_SEL') {
            Rx_1.Observable.forkJoin(this.getDatasetHeaders()).subscribe(function (tsvFiles) {
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
    ToolsModalController.prototype.getMetadataColumns = function () {
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
    ToolsModalController.prototype.selectionOptionsContains = function (options, value) {
        for (var _i = 0, options_1 = options; _i < options_1.length; _i++) {
            var option = options_1[_i];
            if (value === option.id) {
                return true;
            }
        }
        return false;
    };
    return ToolsModalController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ToolsModalController;
ToolsModalController.$inject = ['$uibModalInstance', '$uibModal', '$scope', '$filter', '$q', 'selectedTool', 'selectedCategory', 'selectedModule',
    'inputBindings', 'selectedDatasets', 'ToolService', 'TSVReader', 'SessionDataService', 'modules', 'tools'];
//# sourceMappingURL=toolsmodal.controller.js.map