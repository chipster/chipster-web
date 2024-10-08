import { HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { jwtDecode } from "jwt-decode";
import { BehaviorSubject } from "rxjs";
import ParsedToken from "./parsed-token";

@Injectable()
export class TokenService {
  tokenHeader: {};

  readonly KEY_TOKEN = "ch-auth-token";

  private username$: BehaviorSubject<string> = new BehaviorSubject(null);

  private username: string;
  private name: string;
  private validUntil: Date;
  private roles: string[] = [];

  constructor() {}

  static getUsernameFromUserId(userId: string) {
    const regExp = new RegExp(".*?/(.*)"); // find first / and remember everything after it
    const result = regExp.exec(userId);
    // [1] contains the remembered part
    if (result && result[1].length > 0) {
      return result[1];
    }
    return userId;
  }

  clear(): void {
    localStorage.clear();
  }

  getHttpBasicHeader(username: string, password: string) {
    return new HttpHeaders().set("Authorization", "Basic " + btoa(username + ":" + password));
  }

  getTokenHeader(): HttpHeaders {
    return this.getTokenHeaderWithToken(this.getToken());
  }

  getTokenHeaderWithToken(token: string): HttpHeaders {
    return this.getHttpBasicHeader("token", token);
  }

  /**
   * Get token header for http requests using a custom token
   *
   * For example, to make a request with session specific token.
   *
   * @param token
   * @returns
   */
  getTokenParamsWithToken(token: string) {
    return {
      headers: this.getTokenHeaderWithToken(token),
    };
  }

  /**
   * Get token header for http requests, using user's general authentication token
   *
   * This token gives access to all sessions of the user.
   *
   * @param withCredentials
   * @returns
   */
  getTokenParams(withCredentials: boolean) {
    // TODO why withCredentials is set for some requests, but not all?
    if (withCredentials) {
      return {
        headers: this.getTokenHeader(),
        withCredentials: true,
      };
    }
    return {
      headers: this.getTokenHeader(),
    };
  }

  getToken(): string {
    return localStorage.getItem(this.KEY_TOKEN);
  }

  hasRole(role: string) {
    return this.roles.includes(role);
  }

  getUsername(): string {
    return this.username$.value;
  }

  /**
   * Temporary fix until username / userid terminology gets sorted
   *
   */
  getAccountName(): string {
    // return this.name;
    return TokenService.getUsernameFromUserId(this.getUsername());
  }

  getName(): string {
    return this.name;
  }

  getUsername$() {
    return this.username$;
  }

  getValidUntil(): Date {
    return this.validUntil;
  }

  setAuthToken(token: string): void {
    if (token != null) {
      const parsedToken: ParsedToken = jwtDecode(token);
      const expString = parsedToken.exp;
      const expSeconds = parseInt(expString, 10);
      const exp = new Date(expSeconds * 1000);

      localStorage.setItem(this.KEY_TOKEN, token);
      this.username = parsedToken.sub;
      this.name = parsedToken.name;
      this.validUntil = exp;
      this.roles = parsedToken.roles;
    } else {
      // item has to be removed explicitly, because setItem(..., null) would be converted to a 'null' string
      localStorage.removeItem(this.KEY_TOKEN);
      this.username = null;
      this.name = null;
      this.validUntil = null;
      this.roles = [];
    }
    this.username$.next(this.username);
  }

  isLoggedIn() {
    return this.isTokenValid();
  }

  isTokenValid() {
    // Dates are stored and compared in UTC, but Date.toString() converts to local time
    return this.getToken() && this.getValidUntil() > new Date();
  }

  tokenHasExpired() {
    return this.getToken() && !this.isTokenValid();
  }
}
