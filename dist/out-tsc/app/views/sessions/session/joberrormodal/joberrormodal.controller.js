JobErrorModalController.$inject = ['$uibModalInstance', 'toolErrorTitle', 'toolError'];
function JobErrorModalController($uibModalInstance, toolErrorTitle, toolError) {
    this.toolErrorTitle = toolErrorTitle;
    this.toolError = toolError;
    this.close = function () {
        $uibModalInstance.close();
    };
}
;
export default JobErrorModalController;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/joberrormodal/joberrormodal.controller.js.map