var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import ConfigService from "../services/config.service";
import { Injectable } from "@angular/core";
import { RestService } from "../../core/rest-services/restservice/rest.service";
import { TokenService } from "../../core/authentication/token.service";
export var SessionWorkerResource = (function () {
    function SessionWorkerResource(tokenService, configService, restService) {
        this.tokenService = tokenService;
        this.configService = configService;
        this.restService = restService;
    }
    SessionWorkerResource.prototype.getPackageUrl = function (sessionId) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionWorkerUrl();
        return apiUrl$.map(function (url) { return (url + "/sessions/" + sessionId + "?token=" + _this.tokenService.getToken()); });
    };
    ;
    SessionWorkerResource.prototype.extractSession = function (sessionId, zipDatasetId) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionWorkerUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.post(url + "/sessions/" + sessionId + "/datasets/" + zipDatasetId, {}, true); });
    };
    SessionWorkerResource = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [TokenService, ConfigService, RestService])
    ], SessionWorkerResource);
    return SessionWorkerResource;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/resources/sessionworker.resource.js.map