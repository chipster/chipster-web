import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { TokenService } from "../../core/authentication/token.service";
import { Observable } from "rxjs";

@Injectable()
export class AuthHttpClientService {
  constructor(private httpClient: HttpClient, private tokenService: TokenService) {}

  /**
   * Make unauthenticated GET request
   *
   * @param url
   * @param options
   */
  get(url, options?) {
    return this.httpClient.get(url, options);
  }

  /**
   * Make authenticated GET request
   *
   * @param url
   */
  getAuth(url): Observable<any> {
    return this.httpClient.get(url, this.getAuthHeader());
  }

  getAuthHeader() {
    let headers = new HttpHeaders();
    headers = headers.append("Authorization", "Basic " + btoa("token:" + this.tokenService.getToken()));
    return { headers: headers };
  }

  /**
   * Make authenticated POST request
   *
   * @param url
   * @param obj
   */
  postAuth(url: string, obj: any): any {
    return this.httpClient.post(url, obj, this.getAuthHeader());
  }

  /**
   * Make authenticated PUT request
   *
   * @param url
   * @param obj
   */
  putAuth(url: string, obj: any): any {
    return this.httpClient.put(url, obj, this.getAuthHeader());
  }

  /**
   * Make authenticated DELETE request
   *
   * @param url
   */
  deleteAuth(url): Observable<any> {
    return this.httpClient.delete(url, this.getAuthHeader());
  }

  getAuthWithParams(url, params?): Observable<any> {
    console.log(params);
    let headers = new HttpHeaders();
    headers = headers.append("Authorization", "Basic " + btoa("token:" + this.tokenService.getToken()));

    return this.httpClient.get(url, { headers: headers, params: params });
  }
}
