"use strict";
var _ = require("lodash");
var InputsModalController = (function () {
    function InputsModalController($log, $uibModalInstance, toolService, // used by the template
        selectedTool, moduleName, categoryName, inputBindings, selectedDatasets) {
        this.$log = $log;
        this.$uibModalInstance = $uibModalInstance;
        this.toolService = toolService;
        this.selectedTool = selectedTool;
        this.moduleName = moduleName;
        this.categoryName = categoryName;
        this.inputBindings = inputBindings;
        this.selectedDatasets = selectedDatasets;
    }
    InputsModalController.prototype.$onInit = function () {
    };
    ;
    InputsModalController.prototype.close = function () {
        this.$uibModalInstance.close({ inputBindings: this.inputBindings });
    };
    ;
    InputsModalController.prototype.inputSelected = function (changedBinding) {
        // unselect new selection(s) from other bindings
        for (var _i = 0, _a = this.inputBindings; _i < _a.length; _i++) {
            var inputBinding = _a[_i];
            if (inputBinding != changedBinding) {
                //let updated: Dataset[] = [];
                for (var _b = 0, _c = changedBinding.datasets; _b < _c.length; _b++) {
                    var changed = _c[_b];
                    for (var _d = 0, _e = inputBinding.datasets; _d < _e.length; _d++) {
                        var dataset = _e[_d];
                        if (changed.datasetId != dataset.datasetId) {
                        }
                        else {
                            _.pull(inputBinding.datasets, dataset);
                        }
                    }
                }
            }
        }
    };
    return InputsModalController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InputsModalController;
InputsModalController.$inject = ['$log', '$uibModalInstance', 'ToolService', 'selectedTool', 'moduleName', 'categoryName', 'inputBindings', 'selectedDatasets'];
//# sourceMappingURL=inputsmodal.controller.js.map