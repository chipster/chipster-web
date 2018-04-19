import {AuthenticationService} from "../../core/authentication/authenticationservice";
import {TokenService} from "../../core/authentication/token.service";

import {Component, OnInit} from '@angular/core';
import {Observable} from "rxjs/Observable";
import { User } from "../../model/user";
import { ConfigService } from "../../shared/services/config.service";

@Component({
  selector: 'ch-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.less']
})
export class NavigationComponent implements OnInit {

  username$: Observable<string>;
  appName$: Observable<string>;

  constructor(
    private tokenService: TokenService,
    private authenticationService: AuthenticationService,
    private configService: ConfigService) {
  }

  ngOnInit() {
    this.username$ = this.authenticationService.getUsersDisplayName$();
    this.tokenService.getToken();

    this.appName$ = this.configService.get(ConfigService.KEY_APP_NAME);
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
