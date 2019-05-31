import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Token } from "chipster-js-common";
import log from "loglevel";
import { UserManager } from "oidc-client";
import { Observable } from "rxjs";
import { share, tap } from "rxjs/operators";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { OidcConfig } from "../../views/login/oidc-config";
import { RestErrorService } from "../errorhandler/rest-error.service";
import { AuthenticationService } from "./authentication-service";

@Injectable()
export class OidcService {
  readonly keyReturnUrl = "returnUrl";
  readonly keyOidcName = "oidcName";

  managers = new Map<string, UserManager>();
  oidcConfigs$: Observable<OidcConfig[]>;

  constructor(
    private configService: ConfigService,
    private authenticationService: AuthenticationService,
    private httpClient: HttpClient,
    private restErrorService: RestErrorService,
    private routeService: RouteService
  ) {
    this.init();
  }

  init() {
    this.oidcConfigs$ = this.httpClient
      .get("http://localhost:8002/oidc/configs")
      .pipe(
        tap((configs: OidcConfig[]) => {
          configs.forEach(oidc => {
            const manager = new UserManager({
              authority: oidc.issuer,
              client_id: oidc.clientId,
              client_secret: oidc.clientSecret,
              redirect_uri: oidc.redirectUri,
              response_type: oidc.responseType,
              scope: "openid profile email",
              filterProtocolClaims: true,
              loadUserInfo: false
            });
            this.managers.set(oidc.oidcName, manager);
          });
        }),
        share()
      );
  }

  startAuthentication(returnUrl: string, oidcConfig: OidcConfig) {
    log.info("returnUrl:", returnUrl);
    log.info("oidcName:", oidcConfig.oidcName);
    // put the returnUrl to local storage, because OIDC login will redirect to new page
    localStorage.setItem(this.keyReturnUrl, returnUrl);
    localStorage.setItem(this.keyOidcName, oidcConfig.oidcName);

    // wait until managers are created
    this.oidcConfigs$.subscribe(
      () => {
        const manager = this.managers.get(oidcConfig.oidcName);
        manager.signinRedirect();
      },
      err => this.restErrorService.showError("oidc config error", err)
    );
  }

  completeAuthentication() {
    const returnUrl = localStorage.getItem(this.keyReturnUrl);
    const oidcName = localStorage.getItem(this.keyOidcName);
    localStorage.removeItem(this.keyReturnUrl);
    localStorage.removeItem(this.keyOidcName);

    log.info("returnUrl:", returnUrl);
    log.info("oidcName:", oidcName);

    // wait until managers are created
    this.oidcConfigs$.subscribe(
      () => {
        const manager = this.managers.get(oidcName);
        manager.signinRedirectCallback().then(user => {
          this.getToken(user, returnUrl);
        });
      },
      err => this.restErrorService.showError("oidc config error", err)
    );
  }

  getToken(user, returnUrl: string) {
    this.httpClient
      .post("http://localhost:8002/oidc", {
        idToken: user.id_token
      })
      .subscribe((token: Token) => {
        this.authenticationService.saveToken(token);
        this.authenticationService.scheduleTokenRefresh();
        this.routeService.navigateAbsolute(returnUrl);
      });
  }

  getOidcConfigs$() {
    return this.oidcConfigs$;
  }
}
