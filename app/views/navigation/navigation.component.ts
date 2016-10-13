import {Component, Inject} from '@angular/core';
import AuthenticationService from "../../authentication/authenticationservice";
import ConfigService from "../../services/config.service";

@Component({
    selector: 'navigation',
    templateUrl: './views/navigation/navigation.html'
})
export class NavigationComponent {

    constructor(@Inject('AuthenticationService') private authenticationService: AuthenticationService,
                @Inject('ConfigService') private configService: ConfigService){}

    isLoggedOut() {
        if (this.authenticationService.getToken() === null) {
            return true;
        }
    };

    logout() {
        this.authenticationService.logout();
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