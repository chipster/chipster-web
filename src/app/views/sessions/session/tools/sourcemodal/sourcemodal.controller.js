"use strict";
var SourceModalController = (function () {
    function SourceModalController($log, $uibModalInstance, module, category, selectedTool, toolResource) {
        this.$log = $log;
        this.$uibModalInstance = $uibModalInstance;
        this.module = module;
        this.category = category;
        this.selectedTool = selectedTool;
        this.toolResource = toolResource;
    }
    SourceModalController.prototype.$onInit = function () {
        var _this = this;
        this.toolResource.getSourceCode(this.selectedTool.name.id).then(function (sourceCode) {
            //this.$log.log(sourceCode);
            _this.source = sourceCode;
        });
    };
    ;
    SourceModalController.prototype.close = function () {
        this.$uibModalInstance.close();
    };
    ;
    return SourceModalController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SourceModalController;
SourceModalController.$inject = ['$log', '$uibModalInstance', 'module', 'category', 'selectedTool', 'ToolResource'];
//# sourceMappingURL=sourcemodal.controller.js.map