
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;

export default class SessionEditModalController {

    static $inject = ['$uibModalInstance', 'title'];

    constructor(private $uibModalInstance: IModalServiceInstance, private title: string) {
    }

    cancel() {
        this.$uibModalInstance.dismiss();
    };

    save() {
        this.$uibModalInstance.close(this.title);
    };

}
