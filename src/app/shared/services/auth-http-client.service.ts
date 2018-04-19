import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {TokenService} from '../../core/authentication/token.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AuthHttpClientService {
  constructor(
    private httpClient: HttpClient,
    private tokenService: TokenService,
  ) {}

  get(url, options?) {
    return this.httpClient.get(url, options);
  }

  getAuth(url): Observable<any> {

    let headers = new HttpHeaders();
    headers = headers.append('Authorization', 'Basic ' + btoa('token:' + this.tokenService.getToken()));

    return this.httpClient.get(url, {headers: headers});
  }

  getAuthWithParams(url, params?): Observable<any> {
    console.log(params);
    let headers = new HttpHeaders();
    headers = headers.append('Authorization', 'Basic ' + btoa('token:' + this.tokenService.getToken()));

    return this.httpClient.get(url, {headers: headers, params: params});

  }
}
