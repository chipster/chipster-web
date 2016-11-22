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
var core_1 = require("@angular/core");
var authenticationservice_1 = require("../../authentication/authenticationservice");
var config_service_1 = require("../../services/config.service");
var NavigationComponent = (function () {
    function NavigationComponent(authenticationService, configService) {
        this.authenticationService = authenticationService;
        this.configService = configService;
    }
    NavigationComponent.prototype.isLoggedOut = function () {
        if (this.authenticationService.getToken() === null) {
            return true;
        }
    };
    ;
    NavigationComponent.prototype.logout = function () {
        this.authenticationService.logout();
    };
    ;
    NavigationComponent.prototype.isLoggedIn = function () {
        if (this.authenticationService.getToken() !== null) {
            return true;
        }
    };
    ;
    NavigationComponent.prototype.getHost = function () {
        return this.configService.getApiUrl();
    };
    ;
    return NavigationComponent;
}());
NavigationComponent = __decorate([
    core_1.Component({
        selector: 'navigation',
        templateUrl: 'app/views/navigation/navigation.html'
    }),
    __param(0, core_1.Inject('AuthenticationService')),
    __param(1, core_1.Inject('ConfigService')),
    __metadata("design:paramtypes", [authenticationservice_1.default,
        config_service_1.default])
], NavigationComponent);
exports.NavigationComponent = NavigationComponent;
//# sourceMappingURL=navigation.component.js.map