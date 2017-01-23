import * as configConstants from '../../core/app.constants';
import ConfigurationResource from "../resources/configurationresource";
import {Injectable} from "@angular/core";
import * as _ from "lodash";
import {CoreServices} from "../../core/core-services";
import {Observable} from "rxjs";

@Injectable()
export default class ConfigService {

  public services: CoreServices;
  private configuration$: Observable<any>;

  constructor(private configurationResource: ConfigurationResource) {
    this.configuration$ = this.configurationResource.getConfiguration().map(this.parseServices).publishReplay(1).refCount();
  }

  getSessionDbUrl(): Observable<string> {
    return this.configuration$.map((services: CoreServices) => services.sessionDb);
  }

  getSessionDbEventsUrl(sessionId: string): Observable<string> {
    return this.configuration$.map((services: CoreServices) => URI(services.sessionDbEvents).path('events/' + sessionId).toString());
  }

  getSessionWorkerUrl(): Observable<string> {
    return this.configuration$.map((services: CoreServices) => services.sessionWorker);
  }

  getFileBrokerUrl(): Observable<string> {
    return this.configuration$.map((services: CoreServices) => services.fileBroker);
  }

  getToolboxUrl(): Observable<string> {
    return this.configuration$.map((services: CoreServices) => services.toolbox);
  }

  getModules(): Array<string> {
    return configConstants.ChipsterModules;
  }

  getConfiguration(): Observable<CoreServices> {
    return this.configuration$;
  }

  private parseServices(configuration: any): CoreServices {
    let services = new CoreServices();
    _.forEach(configuration, (item: any) => {
      let camelCaseRole = item.role.replace(/-([a-z])/g, (m: string, w: string) => w.toUpperCase());
      services[camelCaseRole] = item.publicUri;
    });
    return services;
  }
}

