SessionEditModalController.$inject = ['$scope', '$uibModalInstance', 'title'];

function SessionEditModalController($scope, $uibModalInstance, title) {

    this.title = title;

    this.cancel = function () {
        $uibModalInstance.dismiss();
    };

    this.save = function () {
        $uibModalInstance.close(this.title);
    };

};

export default SessionEditModalController;
