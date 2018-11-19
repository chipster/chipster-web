import { AuthenticationService } from "../../core/authentication/authentication-service";
import { Component, OnInit, ViewChild } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { HttpErrorResponse } from "@angular/common/http";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import log from "loglevel";
import { TokenService } from "../../core/authentication/token.service";
import { Observable } from "rxjs/Observable";

@Component({
  selector: "ch-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.less"]
})
export class LoginComponent implements OnInit {
  // hide this login page initially to avoid flash of it when returning from the SSO and
  // redirecting immediately
  show = false;
  error: string;
  appName$;

  private returnUrl: string;

  public ssoLoginUrl: string;

  @ViewChild("myForm")
  private myForm: FormGroup;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authenticationService: AuthenticationService,
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private routeService: RouteService,
    private tokenService: TokenService
  ) {}

  ngOnInit() {
    // get the return url from the query params
    this.getReturnUrl$().subscribe(url => (this.returnUrl = url));

    // handle returnUrls after SSO login here
    if (this.tokenService.isLoggedIn()) {
      this.redirect();
    } else {
      // not going to redirect, show the page
      this.show = true;
    }

    Observable.forkJoin(
      this.configService.getPublicServices(),
      this.routeService.getAppRoute$().take(1),
      this.getReturnUrl$().take(1)
    ).subscribe(
      res => {
        const conf = res[0];
        const appRoute = res[1];
        const returnUrl = res[2];
        conf
          .filter(s => s.role === "haka")
          .forEach(s => {
            /* There will be many navigations and redirections

            We have to pass appRoute through this chaing to be able to return to the
            correct appRoute after the login. Likewise with returnUrl, when the user's
            token has expired.

            1. user navigates to Shibboleth.sso/Login (determined by the link address)
            2. discovery service
            3. IDP
            4. ShibbolethServlet (determined by the target parameter given in step 1)
            5. back in this app (determined by the appRoute and returnUrl query parameters given in the step 4)
            */
            // url for the ShibbolethServlet in step 4, including the parameters
            // for constructing the url to step 5
            const afterIdpUrl =
              s.publicUri +
              "/secure?" +
              "appRoute=" +
              encodeURIComponent(appRoute) +
              "&" +
              "returnUrl=" +
              encodeURIComponent(returnUrl);

            // url for the Shibboleth login step 1, including the above url for the step 4
            // (which in turn includes the parameters for the step 5)
            this.ssoLoginUrl =
              s.publicUri +
              "/Shibboleth.sso/Login?" +
              "target=" +
              encodeURIComponent(afterIdpUrl);
          });
      },
      err => this.restErrorService.handleError(err, "get configuration failed")
    );

    this.appName$ = this.configService.get(ConfigService.KEY_APP_NAME);
  }

  getReturnUrl$() {
    return this.route.queryParams.map(
      params => params["returnUrl"] || "/sessions"
    );
  }

  redirect() {
    log.info("logged in, return to " + this.returnUrl);
    this.routeService.navigateAbsolute(this.returnUrl);
  }

  login() {
    this.authenticationService
      .login(this.myForm.value.username, this.myForm.value.password)
      .subscribe(
        () => {
          // Route to Session creation page
          this.redirect();
        },
        (errorResponse: HttpErrorResponse) => {
          if (RestErrorService.isForbidden(errorResponse)) {
            this.error = "Incorrect username or password";
          } else {
            this.error = "Connecting to authentication service failed";
            log.error(errorResponse);
          }
        }
      );
  }

  // Hack for the Enter key press for the button type='button'
  keyDownFunction(event) {
    if (event.keyCode === 13) {
      if (this.myForm.value.username && this.myForm.value.password) {
        this.login();
      } else if (!this.myForm.value.username && !this.myForm.value.password) {
        this.error = "Please enter username and password to log in";
      } else if (!this.myForm.value.username) {
        this.error = "Please enter username";
      } else if (!this.myForm.value.password) {
        this.error = "Please enter password";
      }
    }
  }
}
