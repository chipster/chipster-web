import {AuthenticationService} from "../../core/authentication/authenticationservice";
import {TokenService} from "../../core/authentication/token.service";

import {Component, OnInit} from '@angular/core';
import {Observable} from "rxjs/Observable";
import { User } from "../../model/user";
import { ConfigService } from "../../shared/services/config.service";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { ErrorService } from "../../core/errorhandler/error.service";

@Component({
  selector: 'ch-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.less']
})
export class NavigationComponent implements OnInit {

  username$: Observable<string>;
  appName = '';
  appRoute: string;

  constructor(
    private tokenService: TokenService,
    private authenticationService: AuthenticationService,
    private configService: ConfigService,
    private errorService: ErrorService) {
  }

  ngOnInit() {
    this.username$ = this.authenticationService.getUsersDisplayName$();
    this.tokenService.getToken();

    // apply configurable styles
    this.configService.get(ConfigService.KEY_CUSTOM_CSS).subscribe(path => {
      console.log('load custom css from', path);
      if (path) {
        const link = document.createElement('link');
        link.href = path;
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.media = 'screen,print';

        document.getElementsByTagName('head')[0].appendChild(link);
      }
    }, err => {
      // why error service doesn't show these reliably?
      console.log('failed to get the custom css path', err);
      this.errorService.headerError('failed to get the custom css path: ' + err, true);
    });

    this.configService.get(ConfigService.KEY_FAVICON).subscribe(path => {
      console.log('load custom favicon from', path);
      if (path) {
        const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = path;
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    }, err => {
      // why error service doesn't show these reliably?
      console.log('failed to get the favicon path', err);
      this.errorService.headerError('failed to get the custom favicon path: ' + err, true);
    });

    this.configService.get(ConfigService.KEY_APP_NAME).subscribe(name => {
      if (name) {
        this.appName = name;
        this.appRoute = name.toLowerCase();
        document.title = name;
      }
    }, err => {
      // why error service doesn't show these reliably?
      console.log('failed to get the app name', err);
      this.errorService.headerError('failed to get the app name: ' + err, true);
    });
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
