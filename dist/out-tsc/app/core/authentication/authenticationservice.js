var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import ConfigService from "../../shared/services/config.service";
import { Injectable } from "@angular/core";
import { Headers, Http, ResponseContentType } from "@angular/http";
import { TokenService } from "./token.service";
var AuthenticationService = (function () {
    function AuthenticationService(http, ConfigService, tokenService) {
        // this.$rootScope.$on("$routeChangeStart", (event: any, next: any) => {
        //   if (next.$$route.authenticated) {
        //     var userAuth = this.tokenService.getToken();
        //     if (!userAuth) {
        //       console.log('token not found, forward to login');
        //       this.$location.path('/login');
        //     }
        //   }
        // });
        this.http = http;
        this.ConfigService = ConfigService;
        this.tokenService = tokenService;
    }
    // Do the authentication here based on userid and password
    AuthenticationService.prototype.login = function (username, password) {
        var _this = this;
        // clear any old tokens
        this.tokenService.setAuthToken(null);
        return this.requestToken(username, password).map(function (response) {
            var token = response.json().tokenKey;
            _this.tokenService.setAuthToken(token);
        });
    };
    ;
    AuthenticationService.prototype.logout = function () {
        this.tokenService.clear();
    };
    ;
    AuthenticationService.prototype.requestToken = function (username, password) {
        var _this = this;
        return this.ConfigService.getConfiguration().flatMap(function (coreServices) {
            var url = coreServices.authenticationService + "/tokens";
            var encodedString = btoa(username + ":" + password); // base64 encoding
            return _this.http.post(url, {}, {
                withCredentials: true,
                responseType: ResponseContentType.Text,
                headers: new Headers({
                    Authorization: "Basic " + encodedString
                })
            });
        });
    };
    AuthenticationService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [Http, ConfigService, TokenService])
    ], AuthenticationService);
    return AuthenticationService;
}());
export default AuthenticationService;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/core/authentication/authenticationservice.js.map