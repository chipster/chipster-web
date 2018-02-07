import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {TokenService} from "../../core/authentication/token.service";

@Injectable()
export class AuthHttpClientService {
  constructor(
    private httpClient: HttpClient,
    private tokenService: TokenService,
  ) {}

  get(url, options?) {
    return this.httpClient.get(url, options);
  }
  getAuth(url) {

    let headers = new HttpHeaders();
    headers = headers.append('Authorization', 'Basic ' + btoa('token:' + this.tokenService.getToken()));

    return this.httpClient.get(url, {headers: headers});
  }
}