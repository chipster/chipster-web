import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Token } from "chipster-js-common";
import log from "loglevel";
import { UserManager } from "oidc-client";
import { from, Observable } from "rxjs";
import { mergeMap, share, tap } from "rxjs/operators";
import { RouteService } from "../../shared/services/route.service";
import { OidcConfig } from "../../views/login/oidc-config";
import { RestErrorService } from "../errorhandler/rest-error.service";
import { AuthenticationService } from "./authentication-service";

@Injectable()
export class OidcService {
  static readonly keyAppRoute = "oidcAppRoute";

  readonly keyReturnUrl = "oidcReturnUrl";
  readonly keyOidcName = "oidcName";

  managers = new Map<string, UserManager>();
  oidcConfigs$: Observable<OidcConfig[]>;

  constructor(
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
    log.info(
      "start oidc login: returnUrl:",
      returnUrl,
      ", oidcName: ",
      oidcConfig.oidcName +
        ", appRoute: " +
        this.routeService.getAppRouteCurrent()
    );
    // put teh return url, oidc name and app route to local storage,
    // because the OIDC login will redirect to a new page
    localStorage.setItem(this.keyReturnUrl, returnUrl);
    localStorage.setItem(this.keyOidcName, oidcConfig.oidcName);
    localStorage.setItem(
      OidcService.keyAppRoute,
      this.routeService.getAppRouteCurrent()
    );

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
    const appRoute = localStorage.getItem(OidcService.keyAppRoute);
    localStorage.removeItem(this.keyReturnUrl);
    localStorage.removeItem(this.keyOidcName);
    localStorage.removeItem(OidcService.keyAppRoute);

    log.info(
      "complete oidc login: returnUrl:",
      returnUrl,
      ", oidcName: ",
      oidcName + ", appRoute: " + appRoute
    );

    // wait until managers are created
    this.oidcConfigs$
      .pipe(
        mergeMap(() => {
          const manager = this.managers.get(oidcName);
          return from(manager.signinRedirectCallback());
        }),
        mergeMap(user => this.getAndSaveToken(user, returnUrl))
      )
      .subscribe(
        () => {
          // appRoute was lost from the url, becasue all app routes use the same callback url
          // let's put it back
          this.routeService.navigateAbsoluteWithCustomCurrentUrl(
            returnUrl,
            "/" + appRoute
          );
        },
        err => this.restErrorService.showError("oidc error", err)
      );
  }

  getAndSaveToken(user, returnUrl: string) {
    return this.httpClient
      .post("http://localhost:8002/oidc", {
        idToken: user.id_token
      })
      .pipe(
        tap((token: Token) => {
          this.authenticationService.saveToken(token);
          this.authenticationService.scheduleTokenRefresh();
        })
      );
  }

  getOidcConfigs$() {
    return this.oidcConfigs$;
  }
}
