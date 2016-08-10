import Utils from "../../../../../services/utils.service";
import WorkflowGraphService from "../workflowgraph.service";
import SessionResource from "../../../../../resources/session.resource";
import ConfigService from "../../../../../services/config.service";
import AuthenticationService from "../../../../../authentication/authenticationservice";
import SessionDataService from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import Job from "../../../../../model/session/job";

AddDatasetModalController.$inject = ['$log', '$uibModalInstance', '$routeParams', 'SessionResource', 'ConfigService', 'AuthenticationService', 'SessionDataService'];

function AddDatasetModalController(
    $log: ng.ILogService,
    $uibModalInstance: any,
    $routeParams: ng.IRouteParams,
    SessionResource: SessionResource,
    ConfigService: ConfigService,
    AuthenticationService: AuthenticationService,
    SessionDataService: SessionDataService) {
    
    this.flowFileAdded = function (file: any, event: any, flow: any) {
        $log.debug('file added');
        flow.opts.target = function (file: any) {
            return file.chipsterTarget;
        };
        let k = this.createDataset(file.name);
            k.then(function (dataset: Dataset) {
            file.chipsterTarget = URI(ConfigService.getFileBrokerUrl()).path('sessions/' + $routeParams.sessionId + '/datasets/' + dataset.datasetId).addQuery('token', AuthenticationService.getToken()).toString();
            file.resume();
        });
        file.pause();
    };
    this.createDataset = function (name: string) {
        var sessionUrl = SessionResource.service.one('sessions', $routeParams.sessionId);
        var d = new Dataset(name);
        $log.debug('createDataset', d);
        return new Promise(function (resolve) {
            var datasetUrl = sessionUrl.one('datasets');
            datasetUrl.customPOST(d).then(function (response: any) {
                $log.debug(response);
                var location = response.headers('Location');
                d.datasetId = location.substr(location.lastIndexOf('/') + 1);
                var pos = WorkflowGraphService.newRootPosition(Utils.mapValues(SessionDataService.datasetsMap));
                d.x = pos.x;
                d.y = pos.y;
                SessionDataService.datasetsMap.set(d.datasetId, d);
                var datasetUrl = sessionUrl.one('datasets').one(d.datasetId);
                datasetUrl.customPUT(d).then(function () {
                    resolve(d);
                });
            });
        });
    };
    this.flowFileSuccess = function (file: any) {
        file.cancel();
    };
    this.close = function () {
        $uibModalInstance.dismiss();
    };
}

export default AddDatasetModalController;
