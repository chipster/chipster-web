import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;

export default class SessionEditModalController {

    static $inject = ['$uibModalInstance', 'title', 'name'];

    constructor(private $uibModalInstance: IModalServiceInstance, private title: string, private name: string) {
    }

    cancel() {
        this.$uibModalInstance.dismiss();
    };

    save() {
        this.$uibModalInstance.close(this.name);
    };

}
