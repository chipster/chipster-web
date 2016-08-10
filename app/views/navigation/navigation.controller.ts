import AuthenticationService from "../../authentication/authenticationservice";
import ConfigService from "../../services/config.service";

export default class NavigationController {

    static $inject = ['$location', 'AuthenticationService', 'ConfigService'];

    constructor(private $location: ng.ILocationService, private authenticationService: AuthenticationService, private configService: ConfigService) {}

    isLoggedOut() {
        if (this.authenticationService.getToken() === null) {
            return true;
        }
    };

    logout() {
        this.authenticationService.logout();
        this.$location.path("/");
    };

    isLoggedIn() {
         if(this.authenticationService.getToken()!==null){
            return true;
         }
     };

     getHost() {
        return this.configService.getApiUrl();
     };
}

