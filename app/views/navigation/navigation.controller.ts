angular.module('chipster-web').controller('NavigationController', function ($scope, AuthenticationService, $uibModal, $location) {

    $scope.isLoggedOut=function(){
        if(AuthenticationService.getToken()===null){
            return true;
        }
    };

    $scope.logout=function(){
        AuthenticationService.logout();
        $location.path("/");
    };

    $scope.isLoggedIn=function(){
        if(AuthenticationService.getToken()!==null){
            return true;
        }
    };

    $scope.openSessionEditModal = function () {

        var modalInstance = $uibModal.open({
            templateUrl: 'app/views/navigation/sessioneditmodal.html',
            controller: 'SessionEditModalController',
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                title: function () {
                    return angular.copy($scope.title);
                }
            }
        });

        modalInstance.result.then(function (result) {
            $scope.title = result;
        }, function () {
            // modal dismissed
        });
    };


});