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
import { ResponseContentType, Headers } from "@angular/http";
var FileResource = (function () {
    function FileResource(configService, restService) {
        this.configService = configService;
        this.restService = restService;
    }
    /**
     *
     * @param sessionId
     * @param datasetId
     * @param maxBytes -1 for full file
     * @returns {any}
     */
    FileResource.prototype.getData = function (sessionId, datasetId, maxBytes) {
        var _this = this;
        if (maxBytes && maxBytes > -1) {
            return this.getLimitedData(sessionId, datasetId, maxBytes);
        }
        var apiUrl$ = this.configService.getFileBrokerUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.get(url + "/sessions/" + sessionId + "/datasets/" + datasetId, true, { responseType: ResponseContentType.Text }); });
    };
    FileResource.prototype.getLimitedData = function (sessionId, datasetId, maxBytes) {
        var _this = this;
        var apiUrl$ = this.configService.getFileBrokerUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.get(url + "/sessions/" + sessionId + "/datasets/" + datasetId, true, { headers: new Headers({ range: "bytes=0-" + maxBytes }), responseType: ResponseContentType.Text }); });
    };
    FileResource.prototype.uploadData = function (sessionId, datasetId, data) {
        var _this = this;
        var apiUrl$ = this.configService.getFileBrokerUrl();
        return apiUrl$
            .flatMap(function (url) { return _this.restService.put(url + "/sessions/" + sessionId + "/datasets/" + datasetId, data, true, {}, false); });
    };
    FileResource = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [ConfigService, RestService])
    ], FileResource);
    return FileResource;
}());
export default FileResource;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/resources/fileresource.js.map