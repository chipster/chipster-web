import Utils from "../../../../../services/utils.service";
import WorkflowGraphService from "../workflowgraph.service";
import ConfigService from "../../../../../services/config.service";
import AuthenticationService from "../../../../../authentication/authenticationservice";
import SessionDataService from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import IQService = angular.IQService;
import IModalService = angular.ui.bootstrap.IModalService;

AddDatasetModalController.$inject = ['$log', '$uibModalInstance', '$routeParams', 'SessionResource', 'ConfigService', 'AuthenticationService', 'SessionDataService', '$q'];

function AddDatasetModalController(
    $log: ng.ILogService,
    $uibModalInstance: IModalService,
    $routeParams: ng.route.IRouteParamsService,
    ConfigService: ConfigService,
    AuthenticationService: AuthenticationService,
    SessionDataService: SessionDataService,
    $q: IQService) {
    
    this.flowFileAdded = function (file: any, event: any, flow: any) {
        $log.debug('file added');
        flow.opts.target = function (file: any) {
            return file.chipsterTarget;
        };

        let promises = [
            ConfigService.getFileBrokerUrl(),
            this.createDataset(file.name)
        ];

        $q.all(promises).then((results: any) => {
            let url: string = results[0];
            let dataset: Dataset = results[1];

            file.chipsterTarget = URI(url).path('sessions/' + $routeParams['sessionId'] + '/datasets/' + dataset.datasetId).addQuery('token', AuthenticationService.getToken()).toString();
            file.resume();
        });
        file.pause();
    };

    this.createDataset = function (name: string) {

        var d = new Dataset(name);
        $log.debug('createDataset', d);
        return SessionDataService.createDataset(d).then((datasetId: string) => {
                d.datasetId = datasetId;
                var pos = WorkflowGraphService.newRootPosition(Utils.mapValues(SessionDataService.datasetsMap));
                d.x = pos.x;
                d.y = pos.y;
                SessionDataService.datasetsMap.set(d.datasetId, d);
                SessionDataService.updateDataset(d);
                return d;
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
