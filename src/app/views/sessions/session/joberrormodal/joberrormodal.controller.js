"use strict";
JobErrorModalController.$inject = ['$uibModalInstance', 'toolErrorTitle', 'toolError'];
function JobErrorModalController($uibModalInstance, toolErrorTitle, toolError) {
    this.toolErrorTitle = toolErrorTitle;
    this.toolError = toolError;
    this.close = function () {
        $uibModalInstance.close();
    };
}
;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = JobErrorModalController;
//# sourceMappingURL=joberrormodal.controller.js.map