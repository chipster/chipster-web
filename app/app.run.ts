export default function($rootScope, $location, AuthenticationService, ConfigService) {

    ConfigService.init();

    $rootScope.$on("$routeChangeStart", function(event, next) {
        if (next.$$route.authenticated) {
            var userAuth = AuthenticationService.getToken();
            if (!userAuth) {
                console.log('token not found, forward to login');
                $location.path('/login');
            }
        }
    });

};

