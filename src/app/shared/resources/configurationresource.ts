import * as configurationConstants from '../../core/app.constants';
import { Injectable } from '@angular/core';
import '../../rxjs-operators';
import {RestService} from "../../core/rest-services/restservice/rest.service";
import {Observable} from "rxjs";

@Injectable()
export class ConfigurationResource {

    constructor(private restService: RestService){}

    getConfiguration(): Observable<any> {
      return this.restService.get(configurationConstants.ServiceLocator + '/services');
    }
}


