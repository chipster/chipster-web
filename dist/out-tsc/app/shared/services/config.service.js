var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import * as configConstants from '../../core/app.constants';
import ConfigurationResource from "../resources/configurationresource";
import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { CoreServices } from "../../core/core-services";
var ConfigService = (function () {
    function ConfigService(configurationResource) {
        this.configurationResource = configurationResource;
        this.configuration$ = this.configurationResource.getConfiguration().map(this.parseServices).publishReplay(1).refCount();
    }
    ConfigService.prototype.getSessionDbUrl = function () {
        return this.configuration$.map(function (services) { return services.sessionDb; });
    };
    ConfigService.prototype.getSessionDbEventsUrl = function (sessionId) {
        return this.configuration$.map(function (services) { return services.sessionDbEvents; });
    };
    ConfigService.prototype.getSessionWorkerUrl = function () {
        return this.configuration$.map(function (services) { return services.sessionWorker; });
    };
    ConfigService.prototype.getFileBrokerUrl = function () {
        return this.configuration$.map(function (services) { return services.fileBroker; });
    };
    ConfigService.prototype.getToolboxUrl = function () {
        return this.configuration$.map(function (services) { return services.toolbox; });
    };
    ConfigService.prototype.getModules = function () {
        return configConstants.ChipsterModules;
    };
    ConfigService.prototype.getConfiguration = function () {
        return this.configuration$;
    };
    ConfigService.prototype.parseServices = function (configuration) {
        var services = new CoreServices();
        _.forEach(configuration, function (item) {
            var camelCaseRole = item.role.replace(/-([a-z])/g, function (m, w) { return w.toUpperCase(); });
            services[camelCaseRole] = item.publicUri;
        });
        return services;
    };
    ConfigService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [ConfigurationResource])
    ], ConfigService);
    return ConfigService;
}());
export default ConfigService;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/services/config.service.js.map