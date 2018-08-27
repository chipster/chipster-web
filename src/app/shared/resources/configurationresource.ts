import { Injectable } from '@angular/core';
import '../../rxjs-operators';
import {RestService} from '../../core/rest-services/restservice/rest.service';
import {Observable} from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Role, Service } from 'chipster-js-common';
import { TokenService } from '../../core/authentication/token.service';
import { AuthHttpClientService } from '../services/auth-http-client.service';
import { ActivatedRoute, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { RouteService } from '../services/route.service';

declare let YAML: any;

@Injectable()
export class ConfigurationResource {

    constructor(
      private httpClient: HttpClient) { }

  getConfiguration(file: string): Observable<any> {

    return this.httpClient.get('/assets/conf/' + file, { responseType: 'text' })
      .map(conf => YAML.parse(conf));
  }

  getPublicServices(conf: any): Observable<Service[]> {
    const serviceLocatorUrl = conf[Role.SERVICE_LOCATOR];
    return <any> this.httpClient.get(serviceLocatorUrl + '/services');
  }

  getInternalServices(conf: any, token: string): Observable<Service[]> {
    const serviceLocatorUrl = conf[Role.SERVICE_LOCATOR];
    const url = serviceLocatorUrl + '/services/internal';

    // injecting AuhtHttpClientService would create a circular dependency
    // maybe we need some kind of static util class adding auth header?
    let headers = new HttpHeaders();
    headers = headers.append('Authorization', 'Basic ' + btoa('token:' + token));

    return <any> this.httpClient.get(url, {headers: headers});
  }
}


