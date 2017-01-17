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
  };

  getToken(): string {
    return localStorage['ch-auth-token'];
  };

  setAuthToken(val: string): void {
    localStorage['ch-auth-token'] = val;
    this.updateTokenHeader();
  };

  updateTokenHeader(): void {
    // return always the same instance so that we can update it later
    if (!this.tokenHeader) {
      this.tokenHeader = {};
    }
    this.tokenHeader['Authorization'] = 'Basic ' + btoa('token' + ':' + this.getToken())
  };

}
