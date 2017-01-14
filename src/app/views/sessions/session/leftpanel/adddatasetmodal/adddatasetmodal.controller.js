"use strict";
var utils_service_1 = require("../../../../../services/utils.service.ts");
var workflowgraph_service_1 = require("../workflowgraph.service");
var dataset_1 = require("../../../../../model/session/dataset");
var AddDatasetModalController = (function () {
    function AddDatasetModalController($log, $uibModalInstance, $routeParams, ConfigService, AuthenticationService, sessionResource, $q, datasetsMap, sessionId, oneFile, files) {
        this.$log = $log;
        this.$uibModalInstance = $uibModalInstance;
        this.$routeParams = $routeParams;
        this.ConfigService = ConfigService;
        this.AuthenticationService = AuthenticationService;
        this.sessionResource = sessionResource;
        this.$q = $q;
        this.datasetsMap = datasetsMap;
        this.sessionId = sessionId;
        this.oneFile = oneFile;
        this.files = files;
        this.datasetIds = [];
    }
    AddDatasetModalController.prototype.init = function (flow) {
        var _this = this;
        // run outside of the digest cycle
        setTimeout(function () {
            flow.addFile(_this.files[0]);
        }, 0);
    };
    AddDatasetModalController.prototype.flowFileAdded = function (file, event, flow) {
        var _this = this;
        this.$log.debug('file added');
        flow.opts.target = function (file) {
            return file.chipsterTarget;
        };
        var promises = [
            this.ConfigService.getFileBrokerUrl(),
            this.createDataset(this.sessionId, file.name)
        ];
        this.$q.all(promises).then(function (results) {
            var url = results[0];
            var dataset = results[1];
            file.chipsterTarget = URI(url)
                .path('sessions/' + _this.sessionId + '/datasets/' + dataset.datasetId)
                .addSearch('token', _this.AuthenticationService.getToken()).toString();
            file.resume();
            _this.datasetIds.push(dataset.datasetId);
        });
        file.pause();
    };
    AddDatasetModalController.prototype.createDataset = function (sessionId, name) {
        var _this = this;
        var d = new dataset_1.default(name);
        this.$log.debug('createDataset', d);
        return this.sessionResource.createDataset(sessionId, d).then(function (datasetId) {
            d.datasetId = datasetId;
            var pos = workflowgraph_service_1.default.newRootPosition(utils_service_1.default.mapValues(_this.datasetsMap));
            d.x = pos.x;
            d.y = pos.y;
            _this.sessionResource.updateDataset(sessionId, d);
            return d;
        });
    };
    AddDatasetModalController.prototype.flowFileSuccess = function (file) {
        // remove from the list
        file.cancel();
        if (this.oneFile) {
            this.close();
        }
    };
    AddDatasetModalController.prototype.close = function () {
        this.$uibModalInstance.close(this.datasetIds);
    };
    return AddDatasetModalController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AddDatasetModalController;
AddDatasetModalController.$inject = [
    '$log', '$uibModalInstance', '$routeParams', 'ConfigService', 'AuthenticationService',
    'SessionWorkerResource', '$q', 'datasetsMap', 'sessionId', 'oneFile', 'files'
];
//# sourceMappingURL=adddatasetmodal.controller.js.map
