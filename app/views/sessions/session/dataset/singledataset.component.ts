
import Dataset from "../../../../model/session/dataset";
import SessionDataService from "../sessiondata.service";
import Job from "../../../../model/session/job";
import SelectionService from "../selection.service";

class SingleDataset {

    static $inject = ['SessionDataService', 'SelectionService'];

    private dataset: Dataset;
    private sourceJob: Job;
    private jobs: Map;

    constructor(private sessionDataService: SessionDataService, private selectionService: SelectionService){}

    $onInit() {
        this.sourceJob = this.getSourceJob(this.dataset);
    }

    $onChanges(changes) {
        this.dataset = changes.dataset.currentValue;
        this.sourceJob = this.getSourceJob(this.dataset);
    }

    renameDataset() {
        this.sessionDataService.renameDatasetDialog([this.dataset]);
    }

    deleteDatasets() {
        this.sessionDataService.deleteDatasets([this.dataset]);
    }

    exportDatasets() {
        this.sessionDataService.exportDatasets([this.dataset]);
    }

    showHistory() {
        this.sessionDataService.openDatasetHistoryModal();
    }


    getSourceJob(dataset: Dataset) {
        return this.sessionDataService.getJobById(dataset.sourceJob, this.jobs);
    }
}

export default {
    bindings: {
        dataset: '<',
        jobs: '<'
    },
    controller: SingleDataset,
    templateUrl: 'views/sessions/session/dataset/singledataset.html'
}