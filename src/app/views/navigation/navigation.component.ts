import {Component} from '@angular/core';
import {AuthenticationService} from "../../core/authentication/authenticationservice";
import {ConfigService} from "../../shared/services/config.service";
import {Observable} from "rxjs";
import {TokenService} from "../../core/authentication/token.service";

@Component({
    selector: 'ch-navigation',
    templateUrl: './navigation.html'
})
export class NavigationComponent {

    host: Observable<string>;

    constructor(
      private tokenService: TokenService,
      private authenticationService: AuthenticationService,
                private configService: ConfigService){}

    ngOnInit() {
      this.host = this.getHost();
    }

    logout() {
        this.authenticationService.logout();
    };

    isLoggedIn() {
      if(this.tokenService.getToken()) {
        return true;
      }
    };

    getHost(): Observable<string> {
      return this.configService.getSessionDbUrl();
    };
}
