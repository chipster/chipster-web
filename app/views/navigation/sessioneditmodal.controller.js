angular.module('chipster-web').controller('SessionEditModalController', function ($scope, $uibModalInstance, title) {

    this.title = title;

    this.cancel = function () {
        $uibModalInstance.dismiss();
    };

    this.save = function () {
        $uibModalInstance.close(this.title);
    };

});