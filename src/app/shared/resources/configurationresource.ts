import { Injectable } from '@angular/core';
import '../../rxjs-operators';
import {RestService} from "../../core/rest-services/restservice/rest.service";
import {Observable} from "rxjs";
import { HttpClient } from '@angular/common/http';
import { Role } from '../../model/role';

declare let YAML: any;

@Injectable()
export class ConfigurationResource {

    constructor(private httpClient: HttpClient){}

    getConfiguration(): Observable<any> {
      return this.httpClient.get('/assets/conf/chipster.yaml', { responseType: 'text' })
        .map(conf => YAML.parse(conf));
    }

    getServices(conf: any): Observable<any> {
      let serviceLocatorUrl = conf[Role.SERVICE_LOCATOR];
      return this.httpClient.get(serviceLocatorUrl + '/services');
    }
}


