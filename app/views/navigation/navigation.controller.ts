angular.module('chipster-web').controller('NavigationController', function ($scope, AuthenticationService, $uibModal, $location, ConfigService) {

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

    $scope.getHost = function () {
        return ConfigService.getApiUrl();
    };
});