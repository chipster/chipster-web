var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
export var TokenService = (function () {
    function TokenService() {
    }
    TokenService.prototype.clear = function () {
        localStorage.clear();
    };
    TokenService.prototype.getTokenHeader = function () {
        this.updateTokenHeader();
        return this.tokenHeader;
    };
    ;
    TokenService.prototype.getToken = function () {
        return localStorage['ch-auth-token'];
    };
    ;
    TokenService.prototype.setAuthToken = function (val) {
        localStorage['ch-auth-token'] = val;
        this.updateTokenHeader();
    };
    ;
    TokenService.prototype.updateTokenHeader = function () {
        // return always the same instance so that we can update it later
        if (!this.tokenHeader) {
            this.tokenHeader = {};
        }
        this.tokenHeader['Authorization'] = 'Basic ' + btoa('token' + ':' + this.getToken());
    };
    ;
    TokenService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [])
    ], TokenService);
    return TokenService;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/core/authentication/token.service.js.map