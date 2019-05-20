
import {mergeMap} from 'rxjs/operators';
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { SessionDataService } from "../../session-data.service";
import { SelectionService } from "../../selection.service";
import { Dataset, Tool } from "chipster-js-common";
import { Job } from "chipster-js-common";
import { SessionData } from "../../../../../model/session/session-data";
import { DatasetModalService } from "../datasetmodal.service";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import * as _ from "lodash";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";

@Component({
  selector: "ch-file",
  templateUrl: "./file.component.html",
  styleUrls: ["./file.component.less"]
})
export class FileComponent {
  @Input()
  dataset: Dataset;
  @Input()
  private jobs: Map<string, Job>;
  @Input()
  sessionData: SessionData;
  @Input()
  tools: Tool[];

  @Output() doScrollFix = new EventEmitter();

  constructor(
    public selectionService: SelectionService, // used in template
    private sessionDataService: SessionDataService,
    private datasetModalService: DatasetModalService,
    private dialogModalService: DialogModalService,
    private restErrorService: RestErrorService,
  ) {}

  renameDataset() {
    const dataset = _.clone(this.dataset);
    this.dialogModalService
      .openStringModal("Rename dataset", "Dataset name", dataset.name, "Rename").pipe(
      mergeMap(name => {
        dataset.name = name;
        return this.sessionDataService.updateDataset(dataset);
      }))
      .subscribe(null, err => this.restErrorService.showError("dataset rename error", err));
  }

  deleteDatasets() {
    this.sessionDataService.deleteDatasetsLater(this.selectionService.selectedDatasets);
  }

  exportDatasets() {
    this.sessionDataService.exportDatasets([this.dataset]);
  }

  showHistory() {
    this.datasetModalService.openDatasetHistoryModal(
      this.dataset,
      this.sessionData
    );
  }

}
