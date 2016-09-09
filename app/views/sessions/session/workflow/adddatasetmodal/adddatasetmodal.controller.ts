import Utils from "../../../../../services/utils.service";
import WorkflowGraphService from "../workflowgraph.service";
import ConfigService from "../../../../../services/config.service";
import AuthenticationService from "../../../../../authentication/authenticationservice";
import SessionDataService from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import IQService = angular.IQService;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;

export default class AddDatasetModalController {
    static $inject = [
        '$log', '$uibModalInstance', '$routeParams', 'ConfigService', 'AuthenticationService',
        'SessionDataService', '$q', 'datasetsMap'];

    constructor(private $log: ng.ILogService,
                private $uibModalInstance: IModalServiceInstance,
                private $routeParams: ng.route.IRouteParamsService,
                private ConfigService: ConfigService,
                private AuthenticationService: AuthenticationService,
                private SessionDataService: SessionDataService,
                private $q: IQService,
                private datasetsMap: Map<string, Dataset>) {
    }

    flowFileAdded(file: any, event: any, flow: any) {
        this.$log.debug('file added');
        flow.opts.target = function (file: any) {
            return file.chipsterTarget;
        };

        let promises = [
            this.ConfigService.getFileBrokerUrl(),
            this.createDataset(file.name)
        ];

        this.$q.all(promises).then((results: any) => {
            let url: string = results[0];
            let dataset: Dataset = results[1];

            file.chipsterTarget = URI(url)
                .path('sessions/' + this.SessionDataService.getSessionId() + '/datasets/' + dataset.datasetId)
                .addSearch('token', this.AuthenticationService.getToken()).toString();
            file.resume();
        });
        file.pause();
    }

    createDataset(name: string) {
        var d = new Dataset(name);
        this.$log.debug('createDataset', d);
        return this.SessionDataService.createDataset(d).then((datasetId: string) => {
            d.datasetId = datasetId;
            var pos = WorkflowGraphService.newRootPosition(Utils.mapValues(this.datasetsMap));
            d.x = pos.x;
            d.y = pos.y;
            this.SessionDataService.updateDataset(d);
            return d;
        });
    }

    flowFileSuccess(file: any) {
        file.cancel();
    }

    close() {
        this.$uibModalInstance.dismiss();
    }
}