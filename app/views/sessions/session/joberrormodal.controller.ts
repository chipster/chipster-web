angular.module('chipster-web').controller('JobErrorModalController',
    function ($log, $uibModalInstance, toolErrorTitle, toolError) {

    this.toolErrorTitle = toolErrorTitle;
    this.toolError = toolError;

    this.close = function () {
        $uibModalInstance.close();
    };
});