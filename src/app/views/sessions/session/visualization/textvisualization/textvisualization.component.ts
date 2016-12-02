import FileResource from "../../../../../resources/fileresource";
import SessionDataService from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";

class TextVisualizationController {

    static $inject = ['FileResource', '$scope', 'SessionDataService'];

    fileSizeLimit = 10 * 1024;

    datasetId: string;
    data: string;
    selectedDatasets: Dataset[];

    constructor(
    	private fileResource: FileResource,
	    private $scope: ng.IScope,
	    private sessionDataService: SessionDataService) {
    }

    $onInit() {
        this.load();
    }

    load() {
        this.fileResource.getLimitedData(this.sessionDataService.getSessionId(), this.datasetId, this.fileSizeLimit).then( (resp: any) => {
            this.$scope.$apply(() => {
              this.data = resp.data;
            });
        });
    }

    loadMore() {
        this.fileSizeLimit *= 2;
        this.load();
    }

    createDataset() {

    	this.sessionDataService.createDerivedDataset("dataset.tsv", [this.datasetId], "Text", this.data);
    }

    getSizeShown() {
        if (this.data) {
            return this.data.length;
        }
    }

    getSizeFull() {
        return this.selectedDatasets[0].size;
    }

    isCompleteFile() {
        return this.getSizeShown() === this.getSizeFull();
    }
}

export default {
    controller: TextVisualizationController,
    templateUrl: './textvisualization.component.html',
    bindings: {
        datasetId: '<',
        selectedDatasets: '<'
    }
}
