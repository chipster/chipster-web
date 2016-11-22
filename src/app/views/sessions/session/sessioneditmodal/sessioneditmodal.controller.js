"use strict";
var SessionEditModalController = (function () {
    function SessionEditModalController($uibModalInstance, title, name) {
        this.$uibModalInstance = $uibModalInstance;
        this.title = title;
        this.name = name;
    }
    SessionEditModalController.prototype.cancel = function () {
        this.$uibModalInstance.dismiss();
    };
    ;
    SessionEditModalController.prototype.save = function () {
        this.$uibModalInstance.close(this.name);
    };
    ;
    return SessionEditModalController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SessionEditModalController;
SessionEditModalController.$inject = ['$uibModalInstance', 'title', 'name'];
//# sourceMappingURL=sessioneditmodal.controller.js.map