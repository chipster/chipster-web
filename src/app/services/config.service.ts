import * as configConstants from '../core/app.constants';
import ConfigurationResource from "../shared/resources/configurationresource";
import {Injectable, Inject} from "@angular/core";
import * as _ from "lodash";
import {CoreServices} from "../core/core-services";
import {Observable} from "rxjs";

@Injectable()
export default class ConfigService {

  public services: CoreServices;
  public config: any = {};
  public baseUrl: string;
  private configuration$: Observable<any>;
  private queryPromise: Promise<any>;

  constructor(@Inject('$location') private $location: ng.ILocationService,
              @Inject('ConfigurationResource') private configurationResource: ConfigurationResource) {
    this.config.modules = configConstants.ChipsterModules;
    this.queryPromise = <Promise<any>>this.configurationResource.getConfigurationResource();

    this.configuration$ = this.configurationResource.getConfiguration().map((configuration: any) => {
      let services = new CoreServices();
      _.forEach(configuration, (item: any) => {
        let camelCaseRole = item.role.replace(/-([a-z])/g, (m: string, w: string) => w.toUpperCase());
        services[camelCaseRole] = item.publicUri;
      });
      return services;
    }).publishReplay(1).refCount();

  }

  getServices() {
    return this.queryPromise.then((response: any) => {
      let services = new CoreServices();

      if (!this.services) {
        _.forEach(response, (item: any) => {
          let camelCaseRole = item.role.replace(/-([a-z])/g, (m: string, w: string) => w.toUpperCase());
          services[camelCaseRole] = item.publicUri;
        });
        this.services = services;
        this.baseUrl = this.services.sessionDb;
        console.log('sessionDb', this.services.sessionDb);
      }
      return this.services;
    });
  }

  getApiUrl() {
    return this.baseUrl;
  }

  getSessionDbUrl() {
    return this.getServices().then((services: CoreServices) => services.sessionDb);
  }

  getSessionDbEventsUrl(sessionId: string) {
    return this.getServices().then((services: CoreServices) => URI(services.sessionDbEvents).path('events/' + sessionId).toString());
  }

  getSessionWorkerUrl() {
    return this.getServices().then((services: CoreServices) => services.sessionWorker);
  }

  getAuthUrl() {
    return this.configuration$.then((services: CoreServices) => services.authenticationService);
  }

  getFileBrokerUrl() {
    return this.getServices().then((services: CoreServices) => services.fileBroker);
  }

  getFileBrokerUrlIfInitialized() {
    return this.services.fileBroker;
  }

  getToolboxUrl() {
    return this.getServices().then((services: CoreServices) => services.toolbox);
  }

  getModules() {
    return this.config.modules;
  }

  getConfiguration(): Observable<CoreServices> {
    return this.configuration$;
  }
}

