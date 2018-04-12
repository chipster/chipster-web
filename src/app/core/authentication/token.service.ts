import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { ConfigService } from "../../shared/services/config.service";
import { RestErrorService } from "../errorhandler/rest-error.service";
import { Observable } from "rxjs/Observable";

@Injectable()
export class TokenService {
  tokenHeader: {};

  private username$: BehaviorSubject<string> = new BehaviorSubject(null);

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService
  ) {
    this.username$.next(localStorage.getItem("ch-auth-username"));
  }

  static getUsernameFromUserId(userId: string) {
    const regExp = new RegExp(".*?/(.*)"); // find first / and remember everything after it
    const result = regExp.exec(userId);
    // [1] contains the remembered part
    if (result && result[1].length > 0) {
      return result[1];
    } else {
      return userId;
    }
  }

  clear(): void {
    localStorage.clear();
  }

  getTokenHeader(): any {
    this.updateTokenHeader();
    return this.tokenHeader;
  }

  getToken(): string {
    return localStorage.getItem("ch-auth-token");
  }

  hasRole(role: string) {
    const roles = JSON.parse(localStorage.getItem("ch-auth-roles"));
    return roles && roles.indexOf(role) !== -1;
  }

  getUsername(): string {
    return this.username$.value;
  }

  getUsername$() {
    return this.username$;
  }

  getValidUntil(): Date {
    return new Date(localStorage.getItem("ch-auth-valid-until"));
  }

  setAuthToken(
    token: string,
    username: string,
    validUntil: string,
    roles: string[]
  ): void {
    if (token) {
      localStorage.setItem("ch-auth-token", token);
      localStorage.setItem("ch-auth-username", username);
      localStorage.setItem("ch-auth-valid-until", validUntil);
      localStorage.setItem("ch-auth-roles", JSON.stringify(roles));
      this.username$.next(username);
    } else {
      // item has to be removed explicitly, because setItem(..., null) would be converted to a 'null' string
      localStorage.removeItem("ch-auth-token");
      localStorage.removeItem("ch-auth-username");
      localStorage.removeItem("ch-auth-valid-until");
      localStorage.removeItem("ch-auth-roles");
      this.username$.next(null);
    }
    this.updateTokenHeader();
  }

  updateTokenHeader(): void {
    // return always the same instance so that we can update it later
    if (!this.tokenHeader) {
      this.tokenHeader = {};
    }
    this.tokenHeader["Authorization"] =
      "Basic " + btoa("token" + ":" + this.getToken());
  }

  isLoggedIn() {
    return this.isTokenValid();
  }

  isTokenValid() {
    return this.getToken() && this.getValidUntil() > new Date();
  }

  tokenHasExpired() {
    return this.getToken() && !this.isTokenValid();
  }
}
