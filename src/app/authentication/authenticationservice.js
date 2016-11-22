"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var config_service_1 = require("../services/config.service");
var core_1 = require("@angular/core");
var AuthenticationService = (function () {
    function AuthenticationService(localStorageService, $http, ConfigService, $rootScope, $location) {
        var _this = this;
        this.localStorageService = localStorageService;
        this.$http = $http;
        this.ConfigService = ConfigService;
        this.$rootScope = $rootScope;
        this.$location = $location;
        this.$rootScope.$on("$routeChangeStart", function (event, next) {
            if (next.$$route.authenticated) {
                var userAuth = _this.getToken();
                if (!userAuth) {
                    console.log('token not found, forward to login');
                    _this.$location.path('/login');
                }
            }
        });
    }
    // Do the authentication here based on userid and password
    AuthenticationService.prototype.login = function (username, password) {
        var _this = this;
        // clear any old tokens
        this.setAuthToken(null);
        return this.requestToken('POST', username, password).then(function (response) {
            var token = response.data.tokenKey;
            _this.setAuthToken(token);
        });
    };
    ;
    AuthenticationService.prototype.logout = function () {
        this.localStorageService.clearAll();
    };
    ;
    AuthenticationService.prototype.getTokenHeader = function () {
        this.updateTokenHeader();
        return this.tokenHeader;
    };
    ;
    AuthenticationService.prototype.requestToken = function (method, username, password) {
        var _this = this;
        return this.ConfigService.getAuthUrl().then(function (authUrl) {
            var urlString = URI(authUrl).path('tokens').toString();
            var string = username + ":" + password;
            var encodedString = btoa(string); //Convert it to base64 encoded string
            return _this.$http({
                url: urlString,
                method: method,
                withCredentials: true,
                headers: { 'Authorization': 'Basic ' + encodedString }
            });
        });
    };
    AuthenticationService.prototype.getToken = function () {
        return this.localStorageService.get('auth-token');
    };
    ;
    AuthenticationService.prototype.setAuthToken = function (val) {
        this.localStorageService.set('auth-token', val);
        this.updateTokenHeader();
    };
    ;
    AuthenticationService.prototype.updateTokenHeader = function () {
        // return always the same instance so that we can update it later
        if (!this.tokenHeader) {
            this.tokenHeader = {};
        }
        this.tokenHeader['Authorization'] = 'Basic ' + btoa('token' + ':' + this.getToken());
    };
    ;
    return AuthenticationService;
}());
AuthenticationService = __decorate([
    core_1.Injectable(),
    __param(0, core_1.Inject('localStorageService')),
    __param(1, core_1.Inject('$http')),
    __param(2, core_1.Inject('ConfigService')),
    __param(3, core_1.Inject('$rootScope')),
    __param(4, core_1.Inject('$location')),
    __metadata("design:paramtypes", [Object, Function, config_service_1.default, Object, Object])
], AuthenticationService);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthenticationService;
//# sourceMappingURL=authenticationservice.js.map