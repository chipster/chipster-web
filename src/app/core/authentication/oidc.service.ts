import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import log from "loglevel";
import { UserManager } from "oidc-client";
import { from, Observable } from "rxjs";
import { mergeMap, share, tap } from "rxjs/operators";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { OidcConfig } from "../../views/login/oidc-config";
import { RestErrorService } from "../errorhandler/rest-error.service";
import { AuthenticationService } from "./authentication-service";

@Injectable()
export class OidcService {
  readonly keyReturnUrl = "oidcReturnUrl";
  readonly keyOidcName = "oidcName";

  managers = new Map<string, UserManager>();
  oidcConfigs$: Observable<OidcConfig[]>;

  constructor(
    private authenticationService: AuthenticationService,
    private httpClient: HttpClient,
    private restErrorService: RestErrorService,
    private routeService: RouteService,
    private configService: ConfigService
  ) {
    this.init();
  }

  init() {
    let appId;

    this.oidcConfigs$ = this.configService.get(ConfigService.KEY_APP_ID).pipe(
      tap(id => (appId = id)),
      mergeMap(() => this.configService.getAuthUrl()),
      mergeMap(authUrl => this.httpClient.get(authUrl + "/oidc/configs")),
      tap((configs: OidcConfig[]) => {
        configs
          // allow separate oidc configs for different apps
          .filter(oidc => oidc.appId === appId)
          .forEach(oidc => {
            const manager = new UserManager({
              authority: oidc.issuer,
              client_id: oidc.clientId,
              redirect_uri: window.location.origin + oidc.redirectPath,
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
      oidcConfig.oidcName
    );
    // put teh return url and oidc name to local storage,
    // because the OIDC login will redirect to a new page
    localStorage.setItem(this.keyReturnUrl, returnUrl);
    localStorage.setItem(this.keyOidcName, oidcConfig.oidcName);

    // wait until managers are created
    this.oidcConfigs$.subscribe(
      () => {
        const extraQueryParams = {};
        if (oidcConfig.parameter) {
          const split = oidcConfig.parameter.split("=");
          const key = split[0];
          const value = split[1];
          extraQueryParams[key] = value;
        }

        const manager = this.managers.get(oidcConfig.oidcName);
        manager.signinRedirect({ extraQueryParams: extraQueryParams });
      },
      err => this.restErrorService.showError("oidc config error", err)
    );
  }

  completeAuthentication() {
    const returnUrl = localStorage.getItem(this.keyReturnUrl);
    const oidcName = localStorage.getItem(this.keyOidcName);
    localStorage.removeItem(this.keyReturnUrl);
    localStorage.removeItem(this.keyOidcName);

    log.info("complete oidc login: returnUrl:", returnUrl, ", oidcName: ");

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
          this.routeService.navigateAbsolute(returnUrl);
        },
        err => this.restErrorService.showError("oidc error", err)
      );
  }

  getAndSaveToken(user, returnUrl: string) {
    return this.configService.getAuthUrl().pipe(
      mergeMap(authUrl =>
        this.httpClient.post(authUrl + "/oidc", {
          idToken: user.id_token
        })
      ),
      tap((token: string) => {
        this.authenticationService.saveToken(token);
      })
    );
  }

  getOidcConfigs$() {
    return this.oidcConfigs$;
  }
}
