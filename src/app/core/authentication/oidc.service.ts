import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import log from "loglevel";
import { Observable } from "rxjs";
import { map, mergeMap, share } from "rxjs/operators";
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
  readonly keyLoginSessionId = "chipsterOidcLoginSessionId";

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

  startAuthentication(returnUrl: string, oidcConfig: OidcConfig, authUrl: string) {
    log.info("start oidc login: returnUrl:", returnUrl, ", oidcName: ", oidcConfig.oidcName);

    // wait for configs
    return this.oidcConfigs$.pipe(
      mergeMap(() => {
        // make a request to auth to start the login session
        const createLoginSessionUrl = authUrl + "/oidc/loginSession" + "?oidcName=" + oidcConfig.oidcName;

        log.info("create OIDC login session in  " + createLoginSessionUrl);
        return this.httpClient.post(createLoginSessionUrl, null);
      }),
      map((loginSessionJson: any) => {
        log.info("got OIDC login session response", loginSessionJson);

        const loginSessionId = loginSessionJson[this.keyLoginSessionId];

        // put the return url to local storage,
        // because the OIDC login will redirect to a new page
        localStorage.setItem(this.keyReturnUrl, returnUrl);
        // store chipsterLoginId for the callback
        localStorage.setItem(this.keyLoginSessionId, loginSessionId);

        const loginUrl = authUrl + "/oidc/login";

        log.info("navigate to " + loginUrl);

        const payload = {};
        payload[this.keyLoginSessionId] = loginSessionId;

        // used form post to send the login session id, because otherwise it would be visible in the url
        this.postAndNavigate(loginUrl, payload);

        return null;
      }),
    );
  }

  // https://stackoverflow.com/a/43021899
  postAndNavigate(url: string, payload: any) {
    const form = document.createElement("form");
    // no user interaction is necessary
    form.style.visibility = "hidden";
    // forms by default use GET query strings
    form.method = "POST";
    form.action = url;
    for (const key in payload) {
      log.info("add form field", key, payload[key]);
      const input = document.createElement("input");
      input.name = this.keyLoginSessionId;
      input.name = key;
      input.value = payload[key];
      // add key/value pair to form
      form.appendChild(input);
    }
    // forms cannot be submitted outside of body
    document.body.appendChild(form);
    // send the payload and navigate
    form.submit();
  }

  completeAuthentication() {
    const returnUrl = localStorage.getItem(this.keyReturnUrl);
    const loginSessionId = localStorage.getItem(this.keyLoginSessionId);

    localStorage.removeItem(this.keyReturnUrl);
    localStorage.removeItem(this.keyLoginSessionId);

    if (loginSessionId == null) {
      this.errorService.showError(
        "please log in again",
        new Error("Cannot complete OIDC authentication: login ID not found (probably used already)."),
      );
      return;
    }

    log.info("complete OIDC login: returnUrl:", returnUrl);

    // wait for configs
    this.configService
      .getAuthUrl()
      .pipe(
        mergeMap((authUrl) => {
          const json = {};
          json[this.keyLoginSessionId] = loginSessionId;

          // make a request to auth to complete the login process
          const loginSessionUrl = authUrl + "/oidc/loginSessionComplete";
          log.info("complete OIDC authentication in " + loginSessionUrl);
          // return this.httpClient.post(loginSessionUrl, json, { responseType: "text" });
          return this.httpClient.post(loginSessionUrl, json, { responseType: "text", withCredentials: true });
          // return this.httpClient.delete(loginSessionUrl, { body: json, responseType: "text", withCredentials: true });
          // return this.httpClient.delete(loginSessionUrl, { responseType: "text", withCredentials: true });
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
