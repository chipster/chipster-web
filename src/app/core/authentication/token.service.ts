import { Injectable } from '@angular/core';

@Injectable()
export class TokenService {

  tokenHeader: {};

  constructor() { }

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
    return localStorage.getItem('ch-auth-username');
  }

  setAuthToken(token: string, username: string): void {
    if (token) {
      localStorage.setItem('ch-auth-token', token);
      localStorage.setItem('ch-auth-username', username);
    } else {
      // item has to be removed explicitly, because setItem(..., null) would be converted to a 'null' string
      localStorage.removeItem('ch-auth-token');
      localStorage.removeItem('ch-auth-username');
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
}
