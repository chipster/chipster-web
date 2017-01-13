import { Injectable } from '@angular/core';
import {RestService} from "../../core/rest-services/restservice/rest.service";

@Injectable()
export class SessionResourceService {

  constructor(private restService: RestService) { }

  /*
   getSession(sessionId: string) {
    return this.getService()
    .then((service:restangular.IService) => service.one('sessions', sessionId).get())
    .then((resp: any) => resp.data);
   }
   */

  getSession(sessionId: string) {
    this.restService.get()
  }

}
