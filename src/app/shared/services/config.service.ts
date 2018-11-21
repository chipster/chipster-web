import { ConfigurationResource } from "../resources/configurationresource";
import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { CoreServices } from "../../core/core-services";
import { Observable } from "rxjs/Observable";
import { Service, Role } from "chipster-js-common";
import { Router, NavigationEnd } from "@angular/router";
import { RouteService } from "./route.service";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import log from "loglevel";

@Injectable()
export class ConfigService {
  public static readonly KEY_CUSTOM_CSS = "custom-css";
  public static readonly KEY_FAVICON = "favicon";
  public static readonly KEY_APP_NAME = "app-name";
  public static readonly KEY_TERMS_OF_USE_AUTHS = "terms-of-use-auths";
  public static readonly KEY_TERMS_OF_USE_VERSION = "terms-of-use-version";
  public static readonly KEY_TERMS_OF_USE_PATH = "terms-of-use-path";
  public static readonly KEY_HOME_PATH = "home-path";
  public static readonly KEY_HOME_HEADER_PATH = "home-header-path";
  public static readonly KEY_CONTACT_PATH = "contact-path";
  public static readonly KEY_EXAMPLE_SESSION_OWNER_USER_ID =
    "example-session-owner-user-id";

  private conf$: Observable<any>;
  private chipsterConf$: Observable<any>;
  private publicServices$: Observable<Service[]>;

  constructor(
    private configurationResource: ConfigurationResource,
    private router: Router,
    private routeService: RouteService
  ) {}

  getChipsterConfiguration(): Observable<any> {
    if (!this.chipsterConf$) {
      this.chipsterConf$ = this.configurationResource
        .getConfiguration("chipster.yaml")
        .publishReplay(1)
        .refCount();
    }
    return this.chipsterConf$;
  }

  getConfiguration(): Observable<any> {
    if (!this.conf$) {
      this.conf$ = this.routeService
        .getAppRoute$()
        .distinctUntilChanged()
        .flatMap((appRoute: string) => {
          if (appRoute === "" || appRoute === "chipster") {
            return this.getChipsterConfiguration();
          }
          // don't allow relative paths or anything else weird
          if (!RegExp("^\\w+$").test(appRoute) || appRoute.length > 16) {
            throw Error(
              "illegal app route (max 16 alphanumerics allowed): " + appRoute
            );
          }

          return Observable.forkJoin([
            this.getChipsterConfiguration(),
            this.configurationResource.getConfiguration(appRoute + ".yaml")
          ]).map(confs => {
            // get all properties from the chipster.yaml and override with the appRoute file
            return Object.assign(confs[0], confs[1]);
          });
        })
        .shareReplay(1)
        .take(1);
    }
    return this.conf$;
  }

  getPublicServices(): Observable<any> {
    if (!this.publicServices$) {
      this.publicServices$ = this.getChipsterConfiguration()
        .flatMap(conf => this.configurationResource.getPublicServices(conf))
        .publishReplay(1)
        .refCount();
    }
    return this.publicServices$;
  }

  getInternalServices(token: string): Observable<Service[]> {
    return this.getConfiguration()
      .flatMap(conf =>
        this.configurationResource.getInternalServices(conf, token)
      )
      .publishReplay(1)
      .refCount();
  }

  getInternalService(role: string, token: string): Observable<Service> {
    return this.getInternalServices(token).map(services =>
      this.getFirstByRole(role, services)
    );
  }

  getAuthUrl(): any {
    return this.getPublicUri(Role.AUTH);
  }

  getSessionDbUrl(): Observable<string> {
    return this.getPublicUri(Role.SESSION_DB);
  }

  getSessionDbEventsUrl(sessionId: string): Observable<string> {
    return this.getPublicUri(Role.SESSION_DB_EVENTS);
  }

  getSessionWorkerUrl(): Observable<string> {
    return this.getPublicUri(Role.SESSION_WORKER);
  }

  getFileBrokerUrl(): Observable<string> {
    return this.getPublicUri(Role.FILE_BROKER);
  }

  getToolboxUrl(): Observable<string> {
    return this.getPublicUri(Role.TOOLBOX);
  }

  getTypeService(): Observable<string> {
    return this.getPublicUri(Role.TYPE_SERVICE);
  }

  getModules(): Observable<string[]> {
    return this.getConfiguration().map(conf => conf["modules"]);
  }

  getManualPath(): Observable<string> {
    return this.getConfiguration().map(conf => conf["manual-path"]);
  }

  getManualToolPostfix(): Observable<string> {
    return this.getConfiguration().map(conf => conf["manual-tool-postfix"]);
  }

  getManualRouterPath(): Observable<string> {
    return this.getConfiguration().map(conf => conf["manual-router-path"]);
  }

  get(key: string): Observable<string> {
    return this.getConfiguration()
      .take(1) // otherwise we would have to unsubscribe
      .map(conf => {
        log.debug("get conf key", key, conf);
        return conf[key];
      });
  }

  getFirstByRole(role: string, services: Service[]): Service {
    return services.filter(service => service.role === role)[0];
  }

  getPublicUri(role: string) {
    return this.getPublicServices()
      .map(services => this.getFirstByRole(role, services))
      .map(s => s.publicUri);
  }
}
