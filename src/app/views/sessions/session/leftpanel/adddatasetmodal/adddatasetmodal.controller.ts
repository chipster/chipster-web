import Utils from "../../../../../services/utils.service";
import WorkflowGraphService from "../workflowgraph/workflowgraph.service";
import ConfigService from "../../../../../services/config.service";
import Dataset from "../../../../../model/session/dataset";
import IQService = angular.IQService;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import SessionResource from "../../../../../resources/session.resource";
import {TokenService} from "../../../../../core/authentication/token.service";

export default class AddDatasetModalController {
    static $inject = [
        '$uibModalInstance', '$routeParams', 'ConfigService', 'TokenService',
        'SessionResource', '$q', 'datasetsMap', 'sessionId', 'oneFile', 'files', 'WorkflowGraphService'];

    private datasetIds: string[] = [];

    constructor(private $uibModalInstance: IModalServiceInstance,
                private $routeParams: ng.route.IRouteParamsService,
                private ConfigService: ConfigService,
                private tokenService: TokenService,
                private sessionResource: SessionResource,
                private $q: IQService,
                private datasetsMap: Map<string, Dataset>,
                private sessionId: string,
                private oneFile: boolean,
                private files: any[],
                private workflowGraphService: WorkflowGraphService) {
    }

    init(flow) {
        // run outside of the digest cycle
        setTimeout(() => {
            flow.addFile(this.files[0]);
        }, 0);
    }

    flowFileAdded(file: any, event: any, flow: any) {
        console.debug('file added');
        flow.opts.target = function (file: any) {
            return file.chipsterTarget;
        };

        let promises = [
            this.ConfigService.getFileBrokerUrl().toPromise(),
            this.createDataset(this.sessionId, file.name)
        ];

        this.$q.all(promises).then((results: any) => {
            let url: string = results[0];
            let dataset: Dataset = results[1];
            file.chipsterTarget = URI(url)
                .path('sessions/' + this.sessionId + '/datasets/' + dataset.datasetId)
                .addSearch('token', this.tokenService.getToken()).toString();
            file.resume();
            this.datasetIds.push(dataset.datasetId);
        });
        file.pause();
    }

    createDataset(sessionId: string, name: string) {
        var d = new Dataset(name);
        console.debug('createDataset', d);
        return this.sessionResource.createDataset(sessionId, d).then((datasetId: string) => {
            d.datasetId = datasetId;
            var pos = this.workflowGraphService.newRootPosition(Utils.mapValues(this.datasetsMap));
            d.x = pos.x;
            d.y = pos.y;
            this.sessionResource.updateDataset(sessionId, d);
            return d;
        });
    }

    flowFileSuccess(file: any) {
        // remove from the list
        file.cancel();

        if (this.oneFile) {
            this.close();
        }
    }

    close() {
        this.$uibModalInstance.close(this.datasetIds);
    }
}
