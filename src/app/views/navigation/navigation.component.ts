import {AuthenticationService} from "../../core/authentication/authenticationservice";
import {TokenService} from "../../core/authentication/token.service";

import {Component} from '@angular/core';
import {Observable} from "rxjs/Observable";
import { User } from "../../model/user";

@Component({
  selector: 'ch-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.less']
})
export class NavigationComponent {

  username$: Observable<string>;

  constructor(
    private tokenService: TokenService,
    private authenticationService: AuthenticationService) {

    this.username$ = authenticationService.getUsersDisplayName$();
    tokenService.getToken();
  }

  logout() {
    this.authenticationService.logout();
  }

  isLoggedIn() {
    return this.tokenService.isLoggedIn();
  }

  isAdmin() {
    return this.isLoggedIn() && this.tokenService.hasRole('admin');
  }
}
