import {Component, Inject} from '@angular/core';
import AuthenticationService from "../../core/authentication/authenticationservice";
import ConfigService from "../../services/config.service";

@Component({
    selector: 'ch-navigation',
    templateUrl: './navigation.html'
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
