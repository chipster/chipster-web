import * as configConstants from '../../core/app.constants';
import {ConfigurationResource} from "../resources/configurationresource";
import {Injectable} from "@angular/core";
import * as _ from "lodash";
import {CoreServices} from "../../core/core-services";
import {Observable} from "rxjs";

@Injectable()
export class ConfigService {

  private configuration$: Observable<any>;

  constructor(private configurationResource: ConfigurationResource) {
  }

  getConfiguration() {
    if (!this.configuration$) {
      this.configuration$ = this.configurationResource.getConfiguration().map(this.parseServices).publishReplay(1).refCount();
    }
    return this.configuration$;
  }

  getSessionDbUrl(): Observable<string> {
    return this.getConfiguration().map((services: CoreServices) => services.sessionDb);
  }

  getSessionDbEventsUrl(sessionId: string): Observable<string> {
    return this.getConfiguration().map((services: CoreServices) => services.sessionDbEvents);
  }

  getSessionWorkerUrl(): Observable<string> {
    return this.getConfiguration().map((services: CoreServices) => services.sessionWorker);
  }

  getFileBrokerUrl(): Observable<string> {
    return this.getConfiguration().map((services: CoreServices) => services.fileBroker);
  }

  getToolboxUrl(): Observable<string> {
    return this.getConfiguration().map((services: CoreServices) => services.toolbox);
  }

  getModules(): Array<string> {
    return configConstants.ChipsterModules;
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

