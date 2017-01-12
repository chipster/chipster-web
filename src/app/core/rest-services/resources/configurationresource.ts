import * as configurationConstants from '../../app.constants';
import { Injectable } from '@angular/core';
import '../../../rxjs-operators';
import {RestService} from "../restservice/rest.service";

@Injectable()
export default class ConfigurationResource {

    constructor(private restService: RestService){}

    getConfiguration(): Promise<any> {
        return this.restService.get(configurationConstants.ServiceLocator + '/services').toPromise();
    }

}


