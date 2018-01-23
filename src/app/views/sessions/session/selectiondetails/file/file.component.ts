import {Component, EventEmitter, Input, Output} from "@angular/core";
import {SessionDataService} from "../../sessiondata.service";
import {SelectionService} from "../../selection.service";
import Dataset from "../../../../../model/session/dataset";
import Job from "../../../../../model/session/job";
import {SessionData} from "../../../../../model/session/session-data";
import {DatasetModalService} from "../datasetmodal.service";
import {DialogModalService} from "../../dialogmodal/dialogmodal.service";
import * as _ from 'lodash';

@Component({
  selector: 'ch-file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.less'],
})
export class FileComponent {

  @Input() dataset: Dataset;
  @Input() private jobs: Map<string, Job>;
  @Input() private sessionData: SessionData;
  @Output() onDelete: EventEmitter<any> = new EventEmitter();

  constructor(
    public selectionService: SelectionService, // used in template
    private sessionDataService: SessionDataService,
    private datasetModalService: DatasetModalService,
    private dialogModalService: DialogModalService) {
  }

  renameDataset() {
    let dataset = _.clone(this.dataset);
    this.dialogModalService.openStringModal(
      "Rename dataset", "Dataset name",
      dataset.name, "Rename")
      .flatMap(name => {
        dataset.name = name;
        return this.sessionDataService.updateDataset(dataset);
      })
      .subscribe(null, err => console.log('dataset rename error', err));
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
}
