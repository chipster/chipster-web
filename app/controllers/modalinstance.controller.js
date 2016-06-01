
angular.module('chipster-web').controller('ModalInstanceCtrl', function ($scope, $modalInstance, params) {

    $scope.title = 'File Uploader';

    $scope.ok = function () {
        $modalInstance.close('ok');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});