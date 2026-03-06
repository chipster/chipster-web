import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import log from "loglevel";
import { Observable } from "rxjs";
import { map, mergeMap, share, tap } from "rxjs/operators";
import { ConfigService } from "../../shared/services/config.service";
import { NewsService } from "../../shared/services/news.service";
import { RouteService } from "../../shared/services/route.service";
import { OidcConfig } from "../../views/login/oidc-config";
import { RestErrorService } from "../errorhandler/rest-error.service";
import { TokenService } from "./token.service";
import { ErrorService } from "../errorhandler/error.service";

@Injectable()
export class OidcService {
  readonly keyReturnUrl = "oidcReturnUrl";
  readonly keyChipsterOidcLoginSessionId = "chipsterOidcLoginSessionId";

  // managers = new Map<string, UserManager>();
  oidcConfigs$: Observable<OidcConfig[]>;

  constructor(
    private httpClient: HttpClient,
    private restErrorService: RestErrorService,
    private errorService: ErrorService,
    private routeService: RouteService,
    private configService: ConfigService,
    private tokenService: TokenService,
    private newsService: NewsService,
  ) {
    this.init();
  }

  init() {
    this.oidcConfigs$ = this.configService.getAuthUrl().pipe(
      mergeMap((authUrl) => this.httpClient.get(authUrl + "/oidc/configs")),
      map((configs: OidcConfig[]) => configs),
      share(),
    );
  }

  startAuthentication(returnUrl: string, oidcConfig: OidcConfig) {
    log.info("start oidc login: returnUrl:", returnUrl, ", oidcName: ", oidcConfig.oidcName);

    // wait for configs
    this.oidcConfigs$
      .pipe(
        mergeMap(() => this.configService.getAuthUrl()),
        mergeMap((authUrl) => {
          // make a request to auth to start the login process and get the url where to go next
          const loginInitUrl = authUrl + "/oidc/login" + "?oidcName=" + oidcConfig.oidcName;
          log.info("start OIDC authentication in " + loginInitUrl);
          return this.httpClient.post(loginInitUrl, null);
        }),
      )
      .subscribe({
        next: (loginResponse) => {
          const loginUrl = loginResponse["url"];
          const chipsterOidcLoginId = loginResponse[this.keyChipsterOidcLoginSessionId];

          // put the return url to local storage,
          // because the OIDC login will redirect to a new page
          localStorage.setItem(this.keyReturnUrl, returnUrl);
          // store chipsterLoginId for the callback
          localStorage.setItem(this.keyChipsterOidcLoginSessionId, chipsterOidcLoginId);

          // use the browser to navigate to the authentication service
          log.info("navigate to " + loginUrl);
          window.location.href = "" + loginUrl;
        },
        error: (err) => {
          this.restErrorService.showError("failed to initiate OIDC login", err);
        },
      });
  }

  completeAuthentication() {
    const returnUrl = localStorage.getItem(this.keyReturnUrl);
    const chipsterOidcLoginSessionId = localStorage.getItem(this.keyChipsterOidcLoginSessionId);

    localStorage.removeItem(this.keyReturnUrl);
    localStorage.removeItem(this.keyChipsterOidcLoginSessionId);

    if (chipsterOidcLoginSessionId == null) {
      this.errorService.showError(
        "please log in again",
        new Error("Cannot complete OIDC authentication: login ID not found (probably used already)."),
      );
      return;
    }

    log.info("complete OIDC login: returnUrl:", returnUrl);

    const code = this.routeService.getCurrentQueryParams().code;
    const state = this.routeService.getCurrentQueryParams().state;
    const error = this.routeService.getCurrentQueryParams().error;
    const errorDetails = this.routeService.getCurrentQueryParams().error_details;

    if (error != null) {
      this.restErrorService.showError("error in OIDC authentication: " + error + " (" + errorDetails + ")", null);
      return;
    }

    // wait for configs
    this.configService
      .getAuthUrl()
      .pipe(
        mergeMap((authUrl) => {
          const json = {
            code: code,
            state: state,
          };

          json[this.keyChipsterOidcLoginSessionId] = chipsterOidcLoginSessionId;

          // make a request to auth to start the login process and get the url where to go next
          const loginCompleteUrl = authUrl + "/oidc/callback";
          log.info("complete OIDC authentication in " + loginCompleteUrl);
          return this.httpClient.post(loginCompleteUrl, json, { responseType: "text" });
        }),
      )
      .subscribe({
        next: (chipsterToken) => {
          log.info("save chipster token");
          this.tokenService.setAuthToken(chipsterToken);

          this.newsService.updateNews();

          log.info("navigate to return url", returnUrl);
          this.routeService.navigateAbsolute(returnUrl);
        },
        error: (err) => {
          var message = "failed to complete OIDC login";
          if (err.error != null) {
            //
            message += " (" + err.error + ")";
          }

          this.restErrorService.showError(message, err);
        },
      });
  }

  getOidcConfigs$() {
    return this.oidcConfigs$;
  }
}
