
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;

export default class SessionEditModalController {

    static $inject = ['$uibModalInstance', 'title'];

    title: string;

    constructor(private $uibModalInstance: IModalServiceInstance, title: string) {
        this.title = title;
    }

    cancel() {
        this.$uibModalInstance.dismiss();
    };

    save() {
        this.$uibModalInstance.close(this.title);
    };

}
