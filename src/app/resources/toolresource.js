"use strict";
var ToolResource = (function () {
    function ToolResource(restangular, configService) {
        this.restangular = restangular;
        this.configService = configService;
    }
    ToolResource.prototype.getService = function () {
        var _this = this;
        // init service only once
        if (!this.service) {
            // getToolBoxUrl() returns a Promise
            // this.service will be a promise that resolves to a Restangular service
            this.service = this.configService.getToolboxUrl().then(function (url) {
                // return the Restangular service
                return _this.restangular.withConfig(function (RestangularConfigurer) {
                    RestangularConfigurer.setBaseUrl(url);
                    RestangularConfigurer.setFullResponse(true);
                });
            });
        }
        return this.service;
    };
    ToolResource.prototype.getModules = function () {
        return this.getService().then(function (service) { return service.all('modules').getList(); });
    };
    ToolResource.prototype.getTools = function () {
        return this.getService().then(function (service) { return service.all('tools').getList(); });
    };
    ToolResource.prototype.getSourceCode = function (toolId) {
        return this.getService()
            .then(function (service) { return service.one('tools', toolId).customGET('source'); })
            .then(function (response) { return response.data; });
    };
    return ToolResource;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ToolResource;
ToolResource.$inject = ['Restangular', 'ConfigService'];
;
//# sourceMappingURL=toolresource.js.map