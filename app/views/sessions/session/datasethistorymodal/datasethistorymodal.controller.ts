
export default class DatasetHistoryModalController {

    static $inject = ['$log', '$uibModalInstance'];

    constructor(private $log: ng.ILogService, private $uibModalInstance: angular.ui.bootstrap.IModalServiceInstance){}

    close() {
        this.$uibModalInstance.dismiss();
    }

}