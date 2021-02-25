import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Role, Service } from "chipster-js-common";
import log from "loglevel";
import { Observable } from "rxjs";
import {
  map,
  mergeMap,
  publishReplay,
  refCount,
  shareReplay,
  take
} from "rxjs/operators";
import { ConfigurationResource } from "../resources/configurationresource";
import { RouteService } from "./route.service";

@Injectable()
export class ConfigService {
  public static readonly KEY_CUSTOM_CSS = "custom-css";
  public static readonly KEY_FAVICON = "favicon";
  public static readonly KEY_APP_NAME = "app-name";
  public static readonly KEY_APP_ID = "app-id";
  public static readonly KEY_TERMS_OF_USE_AUTHS = "terms-of-use-auths";
  public static readonly KEY_TERMS_OF_USE_VERSION = "terms-of-use-version";
  public static readonly KEY_TERMS_OF_USE_PATH = "terms-of-use-path";
  public static readonly KEY_HOME_PATH = "home-path";
  public static readonly KEY_HOME_HEADER_PATH = "home-header-path";
  public static readonly KEY_ACCESSIBILITY_PATH = "accessibility-path";
  public static readonly KEY_CONTACT_PATH = "contact-path";
  public static readonly KEY_ACCESS_PATH = "access-path";
  public static readonly KEY_EXAMPLE_SESSION_OWNER_USER_ID =
    "example-session-owner-user-id";
  public static readonly KEY_SUPPORT_SESSION_OWNER_USER_ID =
    "support-session-owner-user-id";
  public static readonly KEY_STATISTICS_IGNORE_USERS =
    "statistics-ignore-users";

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
        .pipe(
          publishReplay(1),
          refCount()
        );
    }
    return this.chipsterConf$;
  }

  getConfiguration(): Observable<any> {
    if (!this.conf$) {
      this.conf$ = this.getChipsterConfiguration().pipe(
        shareReplay(1),
        take(1)
      );
    }
    return this.conf$;
  }

  getPublicServices(): Observable<any> {
    if (!this.publicServices$) {
      this.publicServices$ = this.getChipsterConfiguration().pipe(
        mergeMap(conf => this.configurationResource.getPublicServices(conf)),
        publishReplay(1),
        refCount()
      );
    }
    return this.publicServices$;
  }

  getInternalServices(token: string): Observable<Service[]> {
    return this.getConfiguration().pipe(
      mergeMap(conf =>
        this.configurationResource.getInternalServices(conf, token)
      ),
      publishReplay(1),
      refCount()
    );
  }

  getInternalService(role: string, token: string): Observable<Service> {
    return this.getInternalServices(token).pipe(
      map(services => this.getFirstByRole(role, services))
    );
  }

  getAuthUrl(): Observable<string> {
    return this.getPublicUri(Role.AUTH);
  }

  getSessionDbUrl(): Observable<string> {
    return this.getPublicUri(Role.SESSION_DB);
  }

  getSessionDbEventsUrl(): Observable<string> {
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
    return this.getConfiguration().pipe(map(conf => conf["modules"]));
  }

  getManualPath(): Observable<string> {
    return this.getConfiguration().pipe(map(conf => conf["manual-path"]));
  }

  getManualToolPostfix(): Observable<string> {
    return this.getConfiguration().pipe(
      map(conf => conf["manual-tool-postfix"])
    );
  }

  getManualRouterPath(): Observable<string> {
    return this.getConfiguration().pipe(
      map(conf => conf["manual-router-path"])
    );
  }

  get(key: string): Observable<string> {
    return this.getConfiguration().pipe(
      take(1), // otherwise we would have to unsubscribe
      map(conf => {
        log.debug("get conf key", key, conf);
        return conf[key];
      })
    );
  }

  getFirstByRole(role: string, services: Service[]): Service {
    return services.filter(service => service.role === role)[0];
  }

  getPublicUri(role: string): Observable<string> {
    return this.getPublicServices().pipe(
      map(services => this.getFirstByRole(role, services)),
      map(s => s.publicUri)
    );
  }
}
