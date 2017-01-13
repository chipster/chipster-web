import * as configurationConstants from '../../core/app.constants';
import { Injectable } from '@angular/core';
import '../../rxjs-operators';
import {RestService} from "../../core/rest-services/restservice/rest.service";
import {Observable} from "rxjs";

@Injectable()
export default class ConfigurationResource {

    constructor(private restService: RestService){}

    getConfigurationResource(): Promise<any> {
        return this.restService.get(configurationConstants.ServiceLocator + '/services').toPromise();
    }

    getConfiguration(): Observable<any> {
      return this.restService.get(configurationConstants.ServiceLocator + '/services');
    }



}


