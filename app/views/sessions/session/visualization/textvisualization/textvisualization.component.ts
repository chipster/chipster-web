import FileResource from "../../../../../resources/fileresource";
import SessionDataService from "../../sessiondata.service";

class TextVisualizationController {

    static $inject = ['FileResource', '$scope', 'SessionDataService'];

    datasetId: string;
    data: string;

    constructor(
    	private fileResource: FileResource,
	    private $scope: ng.IScope,
	    private sessionDataService: SessionDataService) {
    }

    $onInit() {
        this.fileResource.getData(this.sessionDataService.getSessionId(), this.datasetId).then( (resp: any) => {
            this.$scope.$apply(() => {
                this.data = resp.data;
            });
        });
    }

    createDataset() {

    	this.sessionDataService.createDerivedDataset("dataset.tsv", [this.datasetId], "Text", this.data);
    }
}

export default {
    controller: TextVisualizationController,
    template: '<button class="btn btn-default" ng-click="$ctrl.createDataset()">Create dataset</button><p>{{$ctrl.data}}</p>',
    bindings: {
        datasetId: '<'
    }
}
