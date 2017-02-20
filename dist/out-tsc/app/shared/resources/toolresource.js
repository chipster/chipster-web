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
import { ResponseContentType } from "@angular/http";
export var ToolResource = (function () {
    function ToolResource(configService, restService) {
        this.configService = configService;
        this.restService = restService;
    }
    ToolResource.prototype.getModules = function () {
        var _this = this;
        var apiUrl$ = this.configService.getToolboxUrl();
        return apiUrl$.flatMap(function (apiUrl) { return _this.restService.get(apiUrl + "/modules"); });
    };
    ToolResource.prototype.getTools = function () {
        var _this = this;
        var apiUrl$ = this.configService.getToolboxUrl();
        return apiUrl$.flatMap(function (apiUrl) { return _this.restService.get(apiUrl + "/tools"); });
    };
    ToolResource.prototype.getSourceCode = function (toolId) {
        var _this = this;
        var apiUrl$ = this.configService.getToolboxUrl();
        return apiUrl$.flatMap(function (apiUrl) { return _this.restService.get(apiUrl + "/tools/" + toolId + "/source", false, { responseType: ResponseContentType.Text }); });
    };
    ToolResource = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [ConfigService, RestService])
    ], ToolResource);
    return ToolResource;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/resources/toolresource.js.map