
import Dataset from "../../../../model/session/dataset";
import SessionDataService from "../sessiondata.service";
import Job from "../../../../model/session/job";
import SelectionService from "../selection.service";

class SingleDataset {

    static $inject = ['SessionDataService', 'SelectionService'];

    private dataset: Dataset;
    private sourceJob: Job;
    private jobs: Job[];

    constructor(private sessionDataService: SessionDataService, private selectionService: SelectionService){}

    $onInit() {
        this.sourceJob = this.getSourceJob(this.dataset);
    }

    $doCheck() {
        if(this.dataset !== this.selectionService.selectedDatasets[0]) {
            this.dataset = this.selectionService.selectedDatasets[0];
            this.sourceJob = this.getSourceJob(this.dataset.sourceJob);
        }
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