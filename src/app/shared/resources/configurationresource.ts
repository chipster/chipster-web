import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Role, Service } from "chipster-js-common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import "../../rxjs-operators";

declare let YAML: any;

@Injectable()
export class ConfigurationResource {
  constructor(private httpClient: HttpClient) {}

  getConfiguration(file: string): Observable<any> {
    return this.httpClient.get("/assets/conf/" + file, { responseType: "text" }).pipe(map((conf) => YAML.parse(conf)));
  }

  getPublicServices(conf: any): Observable<Service[]> {
    const serviceLocatorUrl = conf[Role.SERVICE_LOCATOR];
    return <any>this.httpClient.get(serviceLocatorUrl + "/services");
  }

  getInternalServices(conf: any, token: string): Observable<Service[]> {
    const serviceLocatorUrl = conf[Role.SERVICE_LOCATOR];
    const url = serviceLocatorUrl + "/services/internal";

    // injecting AuhtHttpClientService would create a circular dependency
    // maybe we need some kind of static util class adding auth header?
    let headers = new HttpHeaders();
    headers = headers.append("Authorization", "Basic " + btoa("token:" + token));

    return <any>this.httpClient.get(url, { headers, withCredentials: true });
  }
}
