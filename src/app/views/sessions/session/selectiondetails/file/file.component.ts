import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { Dataset, Tool } from "chipster-js-common";
import * as _ from "lodash";
import { Subject } from "rxjs";
import { mergeMap, takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { GetSessionDataService } from "../../get-session-data.service";
import { SelectionHandlerService } from "../../selection-handler.service";
import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";
import { SessionEventService } from "../../session-event.service";
import { DatasetModalService } from "../datasetmodal.service";

@Component({
  selector: "ch-file",
  templateUrl: "./file.component.html",
  styleUrls: ["./file.component.less"],
})
export class FileComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  dataset: Dataset;
  @Input()
  sessionData: SessionData;
  @Input()
  tools: Tool[];

  @Output() doScrollFix = new EventEmitter();

  datasetName: string;

  private unsubscribe: Subject<any> = new Subject();

  constructor(
    public selectionService: SelectionService, // used in template
    private sessionDataService: SessionDataService,
    private datasetModalService: DatasetModalService,
    private dialogModalService: DialogModalService,
    private restErrorService: RestErrorService,
    private sessionEventService: SessionEventService,
    private getSessionDataService: GetSessionDataService,
    private selectionHandlerService: SelectionHandlerService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.datasetName = this.dataset.name;
  }

  ngOnInit(): void {
    // subscribe to selected dataset content changes, needed for getting new file name after Rename
    this.sessionEventService
      .getSelectedDatasetsContentsUpdatedStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (datasetId) => {
          if (datasetId === this.dataset?.datasetId) {
            this.datasetName = this.sessionData.datasetsMap.get(this.dataset.datasetId)?.name;
          }
        },
      });
  }

  renameDataset() {
    const dataset = _.clone(this.dataset);
    this.dialogModalService
      .openStringModal("Rename file", "File name", dataset.name, "Rename")
      .pipe(
        mergeMap((name) => {
          dataset.name = name;
          return this.sessionDataService.updateDataset(dataset);
        })
      )
      .subscribe({
        error: (err) => this.restErrorService.showError("Rename file failed", err),
      });
  }

  deleteDatasets() {
    this.sessionDataService.deleteDatasetsLater(this.selectionService.selectedDatasets);
  }

  exportDatasets() {
    this.sessionDataService.exportDatasets([this.dataset]);
  }

  showHistory() {
    this.datasetModalService.openDatasetHistoryModal(this.dataset, this.sessionData, this.tools);
  }

  wrangleDataset() {
    this.datasetModalService.openWrangleModal(this.dataset, this.sessionData);
  }

  defineDatasetGroups() {
    this.datasetModalService.openGroupsModal(this.selectionService.selectedDatasets, this.sessionData);
  }

  selectChildren() {
    const children = this.getSessionDataService.getChildren(this.selectionService.selectedDatasets);
    this.selectionHandlerService.setDatasetSelection(children);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
