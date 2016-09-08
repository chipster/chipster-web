import * as configurationConstants from '../app.constants';
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs/Rx";
import { Injectable } from '@angular/core';
import '../rxjs-operators';

@Injectable()
export default class ConfigurationResource {

    constructor(private http: Http){}

    getConfigurationResource() {
        return this.http.get(configurationConstants.ServiceLocator + '/services').map((res:Response) => {
            return res.json() || {};
        }).toPromise();
    }

}


