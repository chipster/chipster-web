
import Dataset from "../../../../../model/session/dataset";
import {SessionDataService} from "../../sessiondata.service";
import Job from "../../../../../model/session/job";
import {Component, Input, Output, EventEmitter} from "@angular/core";
import {DatasetModalService} from "../datasetmodal.service";

@Component({
  selector: 'ch-single-dataset',
  templateUrl: './singledataset.html',
  styles: [`
    .dataset-notes {
        border: none;
        width: 100%;
    }        
  `]
})
export class SingleDatasetComponent {

    @Input() private dataset: Dataset;
    @Input() private jobs: Map<string, Job>;
    @Output() onDelete: EventEmitter<any> = new EventEmitter();
    private sourceJob: Job;

    constructor(
      private sessionDataService: SessionDataService,
      private datasetModalService: DatasetModalService){}

    ngOnInit() {
        this.sourceJob = this.getSourceJob(this.dataset);
    }

    ngOnChanges(changes: any) {
        this.dataset = changes.dataset.currentValue;
        this.sourceJob = this.getSourceJob(this.dataset);
    }

    renameDataset() {
        this.datasetModalService.renameDatasetDialog(this.dataset);
    }

    deleteDatasets() {
        this.onDelete.emit();
    }

    exportDatasets() {
        this.sessionDataService.exportDatasets([this.dataset]);
    }

    showHistory() {
      this.datasetModalService.openDatasetHistoryModal(this.dataset);
    }


    getSourceJob(dataset: Dataset) {
        return this.sessionDataService.getJobById(dataset.sourceJob, this.jobs);
    }
}
