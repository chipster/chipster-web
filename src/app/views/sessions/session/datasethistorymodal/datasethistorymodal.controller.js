"use strict";
var DatasetHistoryModalController = (function () {
    function DatasetHistoryModalController($log, $uibModalInstance) {
        this.$log = $log;
        this.$uibModalInstance = $uibModalInstance;
    }
    DatasetHistoryModalController.prototype.close = function () {
        this.$uibModalInstance.dismiss();
    };
    return DatasetHistoryModalController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DatasetHistoryModalController;
DatasetHistoryModalController.$inject = ['$log', '$uibModalInstance'];
//# sourceMappingURL=datasethistorymodal.controller.js.map