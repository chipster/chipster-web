import { HttpErrorResponse } from "@angular/common/http";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import log from "loglevel";
import { forkJoin as observableForkJoin } from "rxjs";
import { map, take } from "rxjs/operators";
import { AuthenticationService } from "../../core/authentication/authentication-service";
import { OidcService } from "../../core/authentication/oidc.service";
import { TokenService } from "../../core/authentication/token.service";
import { ErrorService } from "../../core/errorhandler/error.service";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { OidcConfig } from "./oidc-config";

@Component({
  selector: "ch-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.less"]
})
export class LoginComponent implements OnInit {
  // hide this login page initially to avoid flash of it when returning from the SSO and
  // redirecting immediately
  show = false;
  initFailed = false;
  error: string;
  appName: string;

  private returnUrl: string;
  public ssoLoginUrl: string;

  @ViewChild("myForm")
  private myForm: FormGroup;

  @ViewChild("usernameInput")
  private usernameInput: ElementRef;
  oidcConfigs: OidcConfig[];

  constructor(
    private route: ActivatedRoute,
    private authenticationService: AuthenticationService,
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private routeService: RouteService,
    private tokenService: TokenService,
    private errorService: ErrorService,
    private oidcService: OidcService
  ) {}

  ngOnInit() {
    // return url is needed in all cases, so start with it
    this.getReturnUrl$().subscribe(
      url => {
        this.returnUrl = url;

        // if already logged in -> redirect
        if (this.tokenService.isLoggedIn()) {
          // check also from server that token is actually valid
          this.authenticationService.checkToken().subscribe(
            (tokenValid: boolean) => {
              if (tokenValid) {
                // existing token is valid, continue
                this.redirect();
              } else {
                // local token exists, but server says it is not valid, clear and continue
                log.info("auth says token is invalid, clearing local token");
                this.tokenService.clear();
                this.continueInit();
              }
            },
            error => {
              log.warn("checking token failed", error);
              this.initFailed = true;
              this.restErrorService.showError(
                "Initializing login page failed",
                error
              );
            }
          );
        } else {
          // no local token -> continue
          this.continueInit();
        }
      },
      err => this.errorService.showError("failed to get the return url", err)
    );
  }

  private continueInit() {
    // fetch everything that's needed
    observableForkJoin(
      this.configService.getPublicServices(),
      this.routeService.getAppRoute$().pipe(take(1)),
      this.configService.get(ConfigService.KEY_APP_NAME).pipe(take(1))
    ).subscribe(
      res => {
        const conf = res[0];
        const appRoute = res[1];
        this.appName = res[2];

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
              encodeURIComponent(this.returnUrl);

            // url for the Shibboleth login step 1, including the above url for the step 4
            // (which in turn includes the parameters for the step 5)
            this.ssoLoginUrl =
              s.publicUri +
              "/Shibboleth.sso/Login?" +
              "target=" +
              encodeURIComponent(afterIdpUrl);
          });

        this.oidcService.getOidcConfigs$().subscribe(
          configs => {
            this.oidcConfigs = configs;

            // everything ready, show login
            this.show = true;
            // allow Angular to create the element first
            setTimeout(() => {
              this.usernameInput.nativeElement.focus();
            }, 0);
          },
          err => this.restErrorService.showError("oidc config error", err)
        );
      },
      error => {
        this.restErrorService.showError(
          error,
          "Initializing login page failed"
        );
        log.warn("get configuration failed", error);
        this.initFailed = true;
      }
    );
  }

  private getReturnUrl$() {
    return this.route.queryParams.pipe(
      map(params => params["returnUrl"] || "/sessions")
    );
  }

  private redirect() {
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

  getOidcConfigs() {
    return this.oidcConfigs;
  }

  oidcLogin(oidc: OidcConfig) {
    this.oidcService.startAuthentication(this.returnUrl, oidc);
  }
}
