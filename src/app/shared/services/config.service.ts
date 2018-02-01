import * as configConstants from '../../../assets/app.constants';
import {ConfigurationResource} from "../resources/configurationresource";
import {Injectable} from "@angular/core";
import * as _ from "lodash";
import {CoreServices} from "../../core/core-services";
import {Observable} from "rxjs";
import {Service} from "../../model/service";

@Injectable()
export class ConfigService {

  private configuration$: Observable<any>;
  private fullConfiguration: Service[];

  constructor(private configurationResource: ConfigurationResource) {
  }

  getConfiguration(): Observable<any> {
    if (!this.configuration$) {
      this.configuration$ = this.configurationResource.getConfiguration().publishReplay(1).refCount()
        .do(conf => this.fullConfiguration = conf)
        .map(conf => this.parseServices(conf));
    }
    return this.configuration$;
  }

  getFullConfiguration(): Observable<Service[]> {
    return this.getConfiguration().map(() => this.fullConfiguration);
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

  getTypeService(): Observable<string> {
    return this.getConfiguration().map((services: CoreServices) => services.typeService);
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

  getService(s: string) {
    return this.getFullConfiguration()
      .flatMap(conf => Observable.from(conf))
      .filter(service => service.role === s)
      .take(1);
  }
}

