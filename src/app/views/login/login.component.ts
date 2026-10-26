import { HttpErrorResponse } from "@angular/common/http";
import { Component, ElementRef, OnInit, inject, viewChild, signal } from "@angular/core";
import { UntypedFormGroup, FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import log from "loglevel";
import { map, mergeMap, tap } from "rxjs/operators";
import { AuthenticationService } from "../../core/authentication/authentication-service";
import { OidcService } from "../../core/authentication/oidc.service";
import { TokenService } from "../../core/authentication/token.service";
import { ErrorService } from "../../core/errorhandler/error.service";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { ConfigService } from "../../shared/services/config.service";
import { NewsService } from "../../shared/services/news.service";
import { RouteService } from "../../shared/services/route.service";
import { OidcConfig } from "./oidc-config";
import { AuthButtonComponent } from "./auth-button.component";

@Component({
  selector: "ch-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.less"],
  imports: [AuthButtonComponent, FormsModule],
})
export class LoginComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authenticationService = inject(AuthenticationService);
  private configService = inject(ConfigService);
  private restErrorService = inject(RestErrorService);
  private routeService = inject(RouteService);
  private tokenService = inject(TokenService);
  private errorService = inject(ErrorService);
  private oidcService = inject(OidcService);
  private newsService = inject(NewsService);

  static CONF_KEY_JAAS_DESCRIPTION = "jaas-description";

  // hide this login page initially to avoid flash of it when returning from the SSO and
  // redirecting immediately
  readonly show = signal(false);
  readonly initFailed = signal(false);
  readonly error = signal<string>(undefined);
  readonly appName = signal<string>(undefined);

  readonly showLoginForm = signal(false);

  private returnUrl: string;
  public ssoLoginUrl: string;

  private readonly myForm = viewChild<UntypedFormGroup>("myForm");

  private readonly usernameInput = viewChild<ElementRef>("usernameInput");
  readonly oidcConfigs = signal<OidcConfig[]>(undefined);

  readonly multipleLoginMethods = signal(false);

  readonly jaasDescription = signal<string>(undefined);

  ngOnInit() {
    // return url is needed in all cases, so start with it
    this.getReturnUrl$().subscribe({
      next: (url) => {
        this.returnUrl = url;

        // if already logged in -> redirect
        if (this.tokenService.isLoggedIn()) {
          // check also from server that token is actually valid
          this.authenticationService.checkToken().subscribe({
            next: (tokenValid: boolean) => {
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
            error: (error) => {
              log.warn("checking token failed", error);
              this.initFailed.set(true);
              this.restErrorService.showError("Initializing login page failed", error);
            },
          });
        } else {
          // no local token -> continue
          this.continueInit();
        }
      },
      error: (err) => this.errorService.showError("failed to get the return url", err),
    });
  }

  private continueInit() {
    this.configService
      .get(ConfigService.KEY_APP_NAME)
      .pipe(
        tap((appName) => {
          this.appName.set(appName);
        }),
        mergeMap(() => this.configService.get(LoginComponent.CONF_KEY_JAAS_DESCRIPTION)),
        tap((desc) => {
          this.jaasDescription.set(desc);
        }),
        mergeMap(() => this.oidcService.getOidcConfigs$()),
        tap((configs: OidcConfig[]) => {
          this.oidcConfigs.set(configs);
          this.multipleLoginMethods.set(this.oidcConfigs() != null && this.oidcConfigs().length > 0);
          this.showLoginForm.set(!this.multipleLoginMethods());

          // everything ready, show login
          this.show.set(true);
        }),
      )
      .subscribe({
        error: (error) => {
          this.restErrorService.showError(error, "Initializing login page failed");
          log.warn("get configuration failed", error);
          this.initFailed.set(true);
        },
      });
  }

  private getReturnUrl$() {
    return this.route.queryParams.pipe(map((params) => params["returnUrl"] || "/sessions"));
  }

  private redirect() {
    log.info("logged in, return to " + this.returnUrl);
    this.routeService.navigateAbsolute(this.returnUrl);
  }

  openLocalLogin() {
    this.showLoginForm.set(true);
    // allow Angular to create the element first
    setTimeout(() => {
      this.usernameInput().nativeElement.focus();
    }, 0);
  }

  login() {
    this.authenticationService.login(this.myForm().value.username, this.myForm().value.password).subscribe({
      next: () => {
        // Route to Session creation page
        log.info("logged in");
        this.newsService.updateNews();
        this.redirect();
      },
      error: (errorResponse: HttpErrorResponse) => {
        if (RestErrorService.isForbidden(errorResponse)) {
          this.error.set("Incorrect username or password");
        } else {
          this.error.set("Connecting to authentication service failed");
          log.error(errorResponse);
        }
      },
    });
  }

  // Hack for the Enter key press for the button type='button'
  keyDownFunction(event) {
    if (event.keyCode === 13) {
      const myForm = this.myForm();
      if (myForm.value.username && myForm.value.password) {
        this.login();
      } else if (!myForm.value.username && !myForm.value.password) {
        this.error.set("Please enter username and password to log in");
      } else if (!myForm.value.username) {
        this.error.set("Please enter username");
      } else if (!myForm.value.password) {
        this.error.set("Please enter password");
      }
    }
  }

  getOidcConfigs() {
    return this.oidcConfigs();
  }

  oidcLogin(oidc: OidcConfig) {
    this.configService
      .getAuthUrl()
      .pipe(mergeMap((authUrl) => this.oidcService.startAuthentication(this.returnUrl, oidc, authUrl)))
      .subscribe({
        error: (err) => {
          if (err.error != null) {
            // http error message is in err.error
            this.restErrorService.showError("failed to initiate OIDC login: " + err.error, err);
          } else {
            // in case we end up here with something else than an http error
            this.restErrorService.showError("failed to initiate OIDC login", err);
          }
        },
      });
  }

  backToAuthSelect() {
    this.showLoginForm.set(false);
  }

  testOidcConfigs: OidcConfig[] = [
    {
      oidcName: "",
      logo: "",
      text: "",
      description: "",
    },
    {
      oidcName: "",
      logo: "",
      text: "",
      description: "",
    },
  ];
}
