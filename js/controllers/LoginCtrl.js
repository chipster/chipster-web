chipsterWeb.controller('LoginCtrl',
    function ($scope, $location, $http, AuthenticationService) {


        $scope.login = function () {

            AuthenticationService.login($scope.username, $scope.password).then( function() {
                //Route to Session creation page
                $location.path("/sessions");
            }, function (response) {
                console.log('login failed', response);
                if (response) {
                    if (response.status === 403) {
                        $scope.error = 'Incorrect username or password.';
                    } else {
                        $scope.error = response.data;
                    }
                } else {
                    $scope.error = 'Could not connect to the server ' + baseURLString;
                }
            });
        };
    });