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
var configConstants = require("../app.constants");
var configurationresource_1 = require("../resources/configurationresource");
var core_1 = require("@angular/core");
var _ = require("lodash");
var Services = (function () {
    function Services() {
    }
    return Services;
}());
var ConfigService = (function () {
    function ConfigService($location, configurationResource) {
        this.$location = $location;
        this.configurationResource = configurationResource;
        this.config = {};
        this.config.modules = configConstants.ChipsterModules;
        this.init();
    }
    ConfigService.prototype.init = function () {
        this.queryPromise = this.configurationResource.getConfigurationResource();
    };
    ConfigService.prototype.getServices = function () {
        var _this = this;
        return this.queryPromise.then(function (response) {
            var services = new Services();
            if (!_this.services) {
                _.forEach(response, function (item) {
                    var camelCaseRole = item.role.replace(/-([a-z])/g, function (m, w) { return w.toUpperCase(); });
                    services[camelCaseRole] = item.publicUri;
                });
                _this.services = services;
                _this.baseUrl = _this.services.sessionDb;
                console.log('sessionDb', _this.services.sessionDb);
            }
            return _this.services;
        });
    };
    ConfigService.prototype.getApiUrl = function () {
        return this.baseUrl;
    };
    ConfigService.prototype.getSessionDbUrl = function () {
        return this.getServices().then(function (services) { return services.sessionDb; });
    };
    ConfigService.prototype.getSessionDbEventsUrl = function (sessionId) {
        return this.getServices().then(function (services) { return URI(services.sessionDbEvents).path('events/' + sessionId).toString(); });
    };
    ConfigService.prototype.getSessionWorkerUrl = function () {
        return this.getServices().then(function (services) { return services.sessionWorker; });
    };
    ConfigService.prototype.getAuthUrl = function () {
        return this.getServices().then(function (services) { return services.authenticationService; });
    };
    ConfigService.prototype.getFileBrokerUrl = function () {
        return this.getServices().then(function (services) { return services.fileBroker; });
    };
    ConfigService.prototype.getFileBrokerUrlIfInitialized = function () {
        return this.services.fileBroker;
    };
    ConfigService.prototype.getToolboxUrl = function () {
        return this.getServices().then(function (services) { return services.toolbox; });
    };
    ConfigService.prototype.getModules = function () {
        return this.config.modules;
    };
    return ConfigService;
}());
ConfigService = __decorate([
    core_1.Injectable(),
    __param(0, core_1.Inject('$location')),
    __param(1, core_1.Inject('ConfigurationResource')),
    __metadata("design:paramtypes", [Object, configurationresource_1.default])
], ConfigService);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ConfigService;
//# sourceMappingURL=config.service.js.map