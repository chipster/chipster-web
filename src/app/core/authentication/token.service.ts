import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Injectable()
export class TokenService {

  tokenHeader: {};

  private username$: BehaviorSubject<string> = new BehaviorSubject(null);

  constructor() {
    this.username$.next(localStorage.getItem('ch-auth-username'));
  }

  clear(): void {
    localStorage.clear();
  }

  getTokenHeader(): any {
    this.updateTokenHeader();
    return this.tokenHeader;
  }

  getToken(): string {
    return localStorage.getItem('ch-auth-token');
  }

  getUsername(): string {
    return this.username$.value;
  }

  getUsername$() {
    return this.username$;
  }

  getValidUntil(): Date {
    return new Date(localStorage.getItem('ch-auth-valid-until'));
  }

  setAuthToken(token: string, username: string, validUntil: string): void {
    if (token) {
      localStorage.setItem('ch-auth-token', token);
      localStorage.setItem('ch-auth-username', username);
      localStorage.setItem('ch-auth-valid-until', validUntil);
      this.username$.next(username);
    } else {
      // item has to be removed explicitly, because setItem(..., null) would be converted to a 'null' string
      localStorage.removeItem('ch-auth-token');
      localStorage.removeItem('ch-auth-username');
      localStorage.removeItem('ch-auth-valid-until');
      this.username$.next(null);
    }
    this.updateTokenHeader();
  }

  updateTokenHeader(): void {
    // return always the same instance so that we can update it later
    if (!this.tokenHeader) {
      this.tokenHeader = {};
    }
    this.tokenHeader['Authorization'] = 'Basic ' + btoa('token' + ':' + this.getToken())
  }

  isLoggedIn() {
    return this.isTokenValid();
  };

  isTokenValid() {
    return this.getToken() && this.getValidUntil() > new Date();
  }

  tokenHasExpired() {
    return this.getToken() && !this.isTokenValid();
  }

}
