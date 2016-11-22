"use strict";
var AddColumnController = (function () {
    function AddColumnController($uibModalInstance, $uibModal, hot, colName) {
        this.$uibModalInstance = $uibModalInstance;
        this.$uibModal = $uibModal;
        this.hot = hot;
        this.colName = colName;
    }
    AddColumnController.prototype.dismiss = function () {
        this.$uibModalInstance.dismiss();
    };
    ;
    AddColumnController.prototype.addColumn = function () {
        var colHeaders = this.hot.getSettings().colHeaders;
        this.hot.alter('insert_col', colHeaders.length);
        // remove undefined column header
        colHeaders.pop();
        colHeaders.push(this.colName);
        this.hot.updateSettings({
            colHeaders: colHeaders
        }, false);
        this.colName = '';
        this.$uibModalInstance.close('update');
    };
    return AddColumnController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AddColumnController;
AddColumnController.$inject = ['$uibModalInstance', '$uibModal', 'hot', 'colName'];
//# sourceMappingURL=addcolumn.controller.js.map