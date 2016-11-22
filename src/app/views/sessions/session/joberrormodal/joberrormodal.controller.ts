JobErrorModalController.$inject = ['$uibModalInstance', 'toolErrorTitle', 'toolError'];

function JobErrorModalController(
    $uibModalInstance: any,
    toolErrorTitle: string,
    toolError: string) {

    this.toolErrorTitle = toolErrorTitle;
    this.toolError = toolError;

    this.close = function () {
        $uibModalInstance.close();
    };
};

export default JobErrorModalController;