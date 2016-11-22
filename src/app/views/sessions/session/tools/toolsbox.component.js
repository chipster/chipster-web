"use strict";
var utils_service_1 = require("../../../../services/utils.service");
var _ = require("lodash");
var ToolsBox = (function () {
    function ToolsBox($filter, $log, $q, $uibModal, ToolService, SessionDataService, SelectionService) {
        this.$filter = $filter;
        this.$log = $log;
        this.$q = $q;
        this.$uibModal = $uibModal;
        this.ToolService = ToolService;
        this.SessionDataService = SessionDataService;
        this.SelectionService = SelectionService;
        //initialization
        this.activeTab = 0; //defines which tab is displayed as active tab in the beginning
        this.selectedModule = null;
        this.selectedCategory = null;
        this.selectedTool = null;
        this.selectedDatasets = [];
        this.inputBindings = null;
    }
    ToolsBox.prototype.$onInit = function () {
        this.modules = _.cloneDeep(this.modules);
        this.selectedDatasets = this.SelectionService.selectedDatasets;
        // TODO do bindings for tools with no inputs?
    };
    // watch for data selection changes
    ToolsBox.prototype.$doCheck = function () {
        if (this.selectedDatasets && (this.selectedDatasets.length !== this.SelectionService.selectedDatasets.length ||
            !utils_service_1.default.equalStringArrays(utils_service_1.default.getDatasetIds(this.selectedDatasets), utils_service_1.default.getDatasetIds(this.SelectionService.selectedDatasets)))) {
            // save for comparison
            this.selectedDatasets = _.cloneDeep(this.SelectionService.selectedDatasets);
            // bind if tool selected
            if (this.selectedTool) {
                this.$log.info("dataset selection changed -> binding inputs");
                this.inputBindings = this.ToolService.bindInputs(this.selectedTool, this.SelectionService.selectedDatasets);
            }
        }
    };
    ToolsBox.prototype.isRunEnabled = function () {
        // TODO add mandatory parameters check
        // either bindings ok or tool without inputs
        return this.inputBindings ||
            (this.selectedTool && (!this.selectedTool.inputs || this.selectedTool.inputs.length === 0));
    };
    // Method for submitting a job
    ToolsBox.prototype.runJob = function () {
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
            this.$log.warn("no input bindings before running a job, binding now");
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
    ToolsBox.prototype.openToolsModal = function () {
        var _this = this;
        var modalInstance = this.$uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/tools/toolsmodal/toolsmodal.html',
            controller: 'ToolsModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                selectedTool: function () {
                    return _this.selectedTool;
                },
                selectedCategory: function () {
                    return _this.selectedCategory;
                },
                selectedModule: function () {
                    return _this.selectedModule;
                },
                inputBindings: function () {
                    return _this.inputBindings;
                },
                selectedDatasets: function () {
                    return _.cloneDeep(_this.SelectionService.selectedDatasets);
                },
                isRunEnabled: function () {
                    return _this.isRunEnabled();
                },
                modules: function () {
                    return _this.modules;
                },
                // TODO remove?
                tools: function () {
                    return _.cloneDeep(_this.tools);
                }
            }
        });
        modalInstance.result.then(function (result) {
            // save settings
            _this.selectedTool = result.selectedTool;
            _this.selectedCategory = result.selectedCategory;
            _this.selectedModule = result.selectedModule;
            _this.inputBindings = result.inputBindings;
            if (result.run) {
                _this.runJob();
            }
        }, function () {
            // modal dismissed
        });
    };
    return ToolsBox;
}());
ToolsBox.$inject = [
    '$filter', '$log', '$q', '$uibModal', 'ToolService', 'SessionDataService',
    'SelectionService'
];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    bindings: {
        modules: '<',
        tools: '<' // TODO remove?
    },
    templateUrl: 'app/views/sessions/session/tools/tools.html',
    controller: ToolsBox
};
//# sourceMappingURL=toolsbox.component.js.map