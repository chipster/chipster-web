import Dataset from "../../../../../model/session/dataset";
import {SessionDataService} from "../../sessiondata.service";
import Job from "../../../../../model/session/job";
import {Component, Input, Output, EventEmitter} from "@angular/core";
import {DatasetModalService} from "../datasetmodal.service";
import {SessionData} from "../../../../../model/session/session-data";

import {DialogModalService} from "../../dialogmodal/dialogmodal.service";
import Tool from "../../../../../model/session/tool";

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
  @Input() private sessionData: SessionData;
  @Output() onDelete: EventEmitter<any> = new EventEmitter();
  private sourceJob: Job;
  private tool:Tool;


  constructor(private sessionDataService: SessionDataService,
              private datasetModalService: DatasetModalService,
              private stringModalService: DialogModalService) {
  }

  ngOnInit() {
    this.sourceJob = this.getSourceJob(this.dataset);
  }

  ngOnChanges(changes: any) {
    this.dataset = changes.dataset.currentValue;
    this.sourceJob = this.getSourceJob(this.dataset);
    this.getUsedToolFromToolset();
  }

  renameDataset() {

    let dataset = _.clone(this.dataset);
    this.stringModalService.openStringModal("Rename dataset", "Dataset name", dataset.name, "Rename").then((name) => {
      if (name) {
        dataset.name = name;
        this.sessionDataService.updateDataset(dataset);
      }
    }, () => {
      // modal dismissed
    });
  }

  deleteDatasets() {
    this.onDelete.emit();
  }

  exportDatasets() {
    this.sessionDataService.exportDatasets([this.dataset]);
  }

  showHistory() {
    this.datasetModalService.openDatasetHistoryModal(this.dataset, this.sessionData);
  }


  getSourceJob(dataset: Dataset) {
    return this.sessionDataService.getJobById(dataset.sourceJob, this.jobs);
  }

  getUsedToolFromToolset(){
    let self=this;
    this.sessionData.tools.forEach(function(tool){
      if(tool.name.id===self.sourceJob.toolId){
        self.tool=tool;
      }
    });
  }
}
