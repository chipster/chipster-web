"use strict";
var SessionResource = (function () {
    function SessionResource(restangular, authenticationService, configService, $q) {
        this.restangular = restangular;
        this.authenticationService = authenticationService;
        this.configService = configService;
        this.$q = $q;
    }
    SessionResource.prototype.getService = function () {
        var _this = this;
        if (!this.service) {
            this.service = this.configService.getSessionWorkerUrl().then(function (url) {
                return _this.restangular.withConfig(function (configurer) {
                    configurer.setBaseUrl(url);
                    // this service is initialized only once, but the Authentication service will update the returned
                    // instance when necessary (login & logout) so that the request is always made with the most up-to-date
                    // credentials
                    configurer.setDefaultHeaders(_this.authenticationService.getTokenHeader());
                    configurer.setFullResponse(true);
                });
            });
        }
        return this.service;
    };
    SessionResource.prototype.getPackageUrl = function (sessionId) {
        var _this = this;
        return this.getService().then(function (service) {
            return URI(service.one('sessions', sessionId).getRestangularUrl())
                .addSearch('token', _this.authenticationService.getToken()).toString();
        });
    };
    SessionResource.prototype.extractSession = function (sessionId, zipDatasetId) {
        return this.getService().then(function (service) {
            return service
                .one('sessions', sessionId)
                .one('datasets', zipDatasetId).customPOST();
        }).then(function (res) {
            return res.warnings;
        });
    };
    return SessionResource;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SessionResource;
SessionResource.$inject = ['Restangular', 'AuthenticationService', 'ConfigService', 'ToolResource', '$q', 'Utils'];
//# sourceMappingURL=sessionworker.resource.js.map