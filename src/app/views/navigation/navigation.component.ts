import {Component, Inject} from '@angular/core';
import AuthenticationService from "../../core/authentication/authenticationservice";
import ConfigService from "../../services/config.service";
import {Observable} from "rxjs";

@Component({
    selector: 'ch-navigation',
    templateUrl: './navigation.html'
})
export class NavigationComponent {

    host: Observable<string>;

    constructor(@Inject('AuthenticationService') private authenticationService: AuthenticationService,
                @Inject('ConfigService') private configService: ConfigService){}

    ngOnInit() {
      this.host = this.getHost();
    }

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

    getHost(): Observable<string> {
        return this.configService.getApiUrl();
    };
}
