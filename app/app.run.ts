import AuthenticationService from "./authentication/authenticationservice";
import ConfigService from "./services/config.service";

export default function(
    $rootScope: any,
    $location: ng.ILocationService,
    AuthenticationService: AuthenticationService) {

    $rootScope.$on("$routeChangeStart", function(event: any, next: any) {
        if (next.$$route.authenticated) {
            var userAuth = AuthenticationService.getToken();
            if (!userAuth) {
                console.log('token not found, forward to login');
                $location.path('/login');
            }
        }
    });

};

