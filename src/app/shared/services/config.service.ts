import {ConfigurationResource} from '../resources/configurationresource';
import {Injectable} from '@angular/core';
import * as _ from 'lodash';
import {CoreServices} from '../../core/core-services';
import {Observable} from 'rxjs/Observable';
import {Service} from '../../model/service';
import { Role } from '../../model/role';

@Injectable()
export class ConfigService {

  private conf$: Observable<any>;
  private publicServices$: Observable<Service[]>;

  constructor(
    private configurationResource: ConfigurationResource) {

    this.conf$ = this.configurationResource.getConfiguration()
      .publishReplay(1).refCount();

    this.publicServices$ = this.conf$
      .flatMap(conf => this.configurationResource.getPublicServices(conf))
      .publishReplay(1).refCount();
  }

  getConfiguration(): Observable<any> {
    return this.conf$;
  }

  getPublicServices(): Observable<any> {
    return this.publicServices$;
  }

  getInternalServices(token: string): Observable<Service[]> {
    return this.conf$
      .flatMap(conf => this.configurationResource.getInternalServices(conf, token))
      .publishReplay(1).refCount();
  }

  getInternalService(role: string, token: string): Observable<Service> {
    return this.getInternalServices(token)
      .map(services => this.getFirstByRole(role, services));
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

  getFirstByRole(role: string, services: Service[]): Service {
    return services
      .filter(service => service.role === role)[0];
  }

  getPublicUri(role: string) {
    return this.getPublicServices()
      .map(services => this.getFirstByRole(role, services))
      .map(s => s.publicUri);
  }
}

