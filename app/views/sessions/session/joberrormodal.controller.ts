JobErrorModalController.$inject = ['$log', '$uibModalInstance', 'toolErrorTitle', 'toolError'];

function JobErrorModalController($log, $uibModalInstance, toolErrorTitle, toolError) {

    this.toolErrorTitle = toolErrorTitle;
    this.toolError = toolError;

    this.close = function () {
        $uibModalInstance.close();
    };
};

export default JobErrorModalController;