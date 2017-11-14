import {Component} from '@angular/core';
import {AuthenticationService} from "../../core/authentication/authenticationservice";
import {TokenService} from "../../core/authentication/token.service";

@Component({
  selector: 'ch-navigation',
  templateUrl: './navigation.html',
  styleUrls: ['./navigation.component.less']
})
export class NavigationComponent {

    username: string;

    constructor(
      private tokenService: TokenService,
      private authenticationService: AuthenticationService){}

    ngOnInit() {
      this.username = this.tokenService.getUsername();
    }

    logout() {
        this.authenticationService.logout();
    };

    isLoggedIn() {
      if(this.tokenService.getToken()) {
        return true;
      }
    };
}
