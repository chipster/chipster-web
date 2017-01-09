
import Dataset from "../../../../../model/session/dataset";
import SessionDataService from "../../sessiondata.service";
import Job from "../../../../../model/session/job";
import SelectionService from "../../selection.service";
import {Component, Inject, Input, Output, EventEmitter} from "@angular/core";

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

    constructor(@Inject('SessionDataService') private sessionDataService: SessionDataService){}

    ngOnInit() {
        this.sourceJob = this.getSourceJob(this.dataset);
    }

    ngOnChanges(changes: any) {
        this.dataset = changes.dataset.currentValue;
        this.sourceJob = this.getSourceJob(this.dataset);
    }

    renameDataset() {
        this.sessionDataService.renameDatasetDialog(this.dataset);
    }

    deleteDatasets() {
        this.onDelete.emit();
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
