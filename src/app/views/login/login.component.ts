import {AuthenticationService} from '../../core/authentication/authenticationservice';
import {Component, OnInit, ViewChild} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {RestErrorService} from '../../core/errorhandler/rest-error.service';
import {HttpErrorResponse} from '@angular/common/http';
import {ConfigService} from '../../shared/services/config.service';
import { RouteService } from '../../shared/services/route.service';
import log from 'loglevel';
import { TokenService } from '../../core/authentication/token.service';

@Component({
  selector: 'ch-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit {

  error: string;
  appName$;

  private returnUrl: string;

  public ssoLoginUrl: string;

  @ViewChild('myForm')
  private myForm: FormGroup;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authenticationService: AuthenticationService,
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private routeService: RouteService,
    private tokenService: TokenService) {
  }

  ngOnInit() {
    // get the return url from the query params
    this.route.queryParams
      .subscribe(params => this.returnUrl = params['returnUrl'] || '/sessions');

    // handle returnUrls after SSO login here
    if (this.tokenService.isLoggedIn()) {
      this.redirect();
    }

    this.configService.getPublicServices()
      .subscribe(conf => {
        conf
          .filter(s => s.role === 'haka')
          .forEach(s => {
            this.ssoLoginUrl = s.publicUri + '/secure?appRoute=' + this.routeService.getAppRouteCurrent() + ';';
          });

      }, err => this.restErrorService.handleError(err, 'get configuration failed'));

    this.appName$ = this.configService.get(ConfigService.KEY_APP_NAME);
  }

  redirect() {
    log.info('logged in, return to ' + this.returnUrl);
    this.routeService.navigateAbsolute(this.returnUrl);
  }

  login() {
    this.authenticationService.login(this.myForm.value.username, this.myForm.value.password).subscribe(() => {
      // Route to Session creation page
      this.redirect();

    }, (errorResponse: HttpErrorResponse) => {

      if (RestErrorService.isForbidden(errorResponse)) {
        this.error = 'Incorrect username or password';
      } else {
        this.error = 'Connecting to authentication service failed';
        log.error(errorResponse);
      }
    });
  }

  // Hack for the Enter key press for the button type='button'
  keyDownFunction(event) {
    if (event.keyCode === 13) {
      if (this.myForm.value.username && this.myForm.value.password) {
        this.login();
      } else if (!this.myForm.value.username && !this.myForm.value.password) {
        this.error = 'Please enter username and password to log in';
      } else if (!this.myForm.value.username) {
        this.error = 'Please enter username';
      } else if (!this.myForm.value.password) {
        this.error = 'Please enter password';
      }
    }
  }
}

