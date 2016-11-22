"use strict";
var FileResource = (function () {
    function FileResource(restangular, authenticationService, configService) {
        this.restangular = restangular;
        this.authenticationService = authenticationService;
        this.configService = configService;
    }
    FileResource.prototype.getService = function () {
        var _this = this;
        // init service only once
        if (!this.service) {
            // this.service will be a promise that resolves to a Restangular service
            this.service = this.configService.getFileBrokerUrl().then(function (url) {
                // return the Restangular service
                return _this.restangular.withConfig(function (configurer) {
                    configurer.setBaseUrl(url);
                    configurer.setDefaultHeaders(_this.authenticationService.getTokenHeader());
                    configurer.setFullResponse(true);
                });
            });
        }
        return this.service;
    };
    FileResource.prototype.getData = function (sessionId, datasetId) {
        return this.getService().then(function (service) { return service
            .one('sessions', sessionId)
            .one('datasets', datasetId)
            .get(); });
    };
    FileResource.prototype.uploadData = function (sessionId, datasetId, data) {
        return this.getService().then(function (service) { return service
            .one('sessions', sessionId)
            .one('datasets', datasetId)
            .customPUT(data); });
    };
    return FileResource;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FileResource;
FileResource.$inject = ['Restangular', 'AuthenticationService', 'ConfigService'];
//# sourceMappingURL=fileresource.js.map