import {ConfigurationResource} from "../resources/configurationresource";
import {Injectable} from "@angular/core";
import * as _ from "lodash";
import {CoreServices} from "../../core/core-services";
import {Observable} from "rxjs";
import {Service} from "../../model/service";
import { Role } from "../../model/role";

@Injectable()
export class ConfigService {
  
  private conf$: Observable<any>
  private services$: Observable<Service[]>

  constructor(
    private configurationResource: ConfigurationResource) {

    this.conf$ = this.configurationResource.getConfiguration()
      .publishReplay(1).refCount();
      
    this.services$ = this.conf$
      .flatMap(conf => this.configurationResource.getServices(conf))
      .publishReplay(1).refCount();
  }

  getConfiguration(): Observable<any> {
    return this.conf$;
  }

  getServices(): Observable<any> {
    return this.services$;
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
    return this.conf$
      .map(conf => conf['modules']);
  }

  getService(s: string): Observable<Service> {
    return this.services$
      // convert to the stream of Service objects
      .flatMap(servicesArray => Observable.from(servicesArray))
      .filter(service => service.role === s)
      .take(1);
  }

  getPublicUri(service: string) {
    return this.getService(service)
      .map(s => s.publicUri);
  }
}

