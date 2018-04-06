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

    this.username$ = tokenService.getUsername$()
      .flatMap(userId => {
        return authenticationService.getUser()
          .catch(err => {
            console.log('failed to get the user details', err);
            // An error message from this request would be confusing, because the user didn't ask for it.
            // Most likely the authentication has expired, but the user will notice it soon anyway.
            return Observable.of({ name: userId });
          });
      })
      .map(user => user.name);

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
