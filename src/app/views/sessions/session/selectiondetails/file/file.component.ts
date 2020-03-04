import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Dataset, Job, Tool } from "chipster-js-common";
import * as _ from "lodash";
import { mergeMap } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";
import { DatasetModalService } from "../datasetmodal.service";

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
    private restErrorService: RestErrorService
  ) {}

  renameDataset() {
    const dataset = _.clone(this.dataset);
    this.dialogModalService
      .openStringModal("Rename file", "File name", dataset.name, "Rename")
      .pipe(
        mergeMap(name => {
          dataset.name = name;
          return this.sessionDataService.updateDataset(dataset);
        })
      )
      .subscribe(null, err =>
        this.restErrorService.showError("Rename file failed", err)
      );
  }

  deleteDatasets() {
    this.sessionDataService.deleteDatasetsLater(
      this.selectionService.selectedDatasets
    );
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
