AddDatasetModalController.$inject = ['$log', '$uibModalInstance', 'Utils', 'data', '$routeParams', 'SessionResource', 'ConfigService', 'AuthenticationService', 'WorkflowGraphService'];

function AddDatasetModalController($log, $uibModalInstance, Utils, data, $routeParams, SessionResource, ConfigService, AuthenticationService, WorkflowGraphService) {
    
    this.flowFileAdded = function (file, event, flow) {
        $log.debug('file added');
        flow.opts.target = function (file) {
            return file.chipsterTarget;
        };
        let k = this.createDataset(file.name);
            k.then(function (dataset) {
            file.chipsterTarget = URI(ConfigService.getFileBrokerUrl()).path('sessions/' + $routeParams.sessionId + '/datasets/' + dataset.datasetId).addQuery('token', AuthenticationService.getToken()).toString();
            file.resume();
        });
        file.pause();
    };
    this.createDataset = function (name) {
        var sessionUrl = SessionResource.one('sessions', $routeParams.sessionId);
        var d = {
            datasetId: null,
            name: name,
            x: null,
            y: null,
            sourceJob: null
        };
        $log.debug('createDataset', d);
        return new Promise(function (resolve) {
            var datasetUrl = sessionUrl.one('datasets');
            datasetUrl.customPOST(d).then(function (response) {
                $log.debug(response);
                var location = response.headers('Location');
                d.datasetId = location.substr(location.lastIndexOf('/') + 1);
                var pos = WorkflowGraphService.newRootPosition(Utils.mapValues(data.datasetsMap));
                d.x = pos.x;
                d.y = pos.y;
                data.datasetsMap.set(d.datasetId, d);
                var datasetUrl = sessionUrl.one('datasets').one(d.datasetId);
                datasetUrl.customPUT(d).then(function () {
                    resolve(d);
                });
            });
        });
    };
    this.flowFileSuccess = function (file) {
        file.cancel();
    };
    this.close = function () {
        $uibModalInstance.dismiss();
    };
};

export default AddDatasetModalController;
