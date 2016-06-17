angular.module('chipster-web').controller('DatasetHistoryModalController', function ($log, $uibModalInstance) {
    this.close = function () {
        $uibModalInstance.dismiss();
    };
});
