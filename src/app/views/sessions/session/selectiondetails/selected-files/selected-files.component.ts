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
import { Dataset, Job, Module, Tool } from "chipster-js-common";
import * as _ from "lodash";
import log from "loglevel";
import { Subject } from "rxjs";
import { mergeMap, takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { ToolsService } from "../../../../../shared/services/tools.service";
import { DialogModalService } from "../../dialogmodal/dialogmodal.service";
import { GetSessionDataService } from "../../get-session-data.service";
import { SelectionHandlerService } from "../../selection-handler.service";
import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";
import { SessionEventService } from "../../session-event.service";
import { ToolSelectionService } from "../../tool.selection.service";
import { ToolService } from "../../tools/tool.service";
import { DatasetModalService } from "../datasetmodal.service";

@Component({
  selector: "ch-selected-files",
  templateUrl: "./selected-files.component.html",
  styleUrls: ["./selected-files.component.less"],
})
export class FileComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  dataset: Dataset;
  @Input()
  sessionData: SessionData;
  @Input()
  tools: Tool[];
  @Input()
  modules: Module[];

  @Output() doScrollFix = new EventEmitter();

  datasetName: string;

  private unsubscribe: Subject<any> = new Subject();
  sourceJob: Job;
  sourceTool: Tool;
  modulesMap: Map<string, Module>;
  sourceJobModule: Module;

  constructor(
    public selectionService: SelectionService, // used in template
    private sessionDataService: SessionDataService,
    private datasetModalService: DatasetModalService,
    private dialogModalService: DialogModalService,
    private restErrorService: RestErrorService,
    private sessionEventService: SessionEventService,
    private getSessionDataService: GetSessionDataService,
    private selectionHandlerService: SelectionHandlerService,
    private changeDetectorRef: ChangeDetectorRef,
    private toolService: ToolService,
    private toolsService: ToolsService,
    private toolSelectionService: ToolSelectionService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.datasetName = this.dataset.name;

    this.sourceJob = this.sessionDataService.getJobById(this.dataset.sourceJob, this.sessionData.jobsMap);

    // if (this.sourceJob != null && this.modulesMap != null) {
    //   log.info("source module found", this.sourceJobModule);
    //   this.sourceJobModule = this.modulesMap.get(this.sourceJob.module);
    // } else {
    //   log.info("source module not found");
    //   this.sourceJobModule = null;
    // }
    // this.sourceTool = this.toolService.getLiveToolForSourceJob(this.sourceJob, this.tools);
  }

  ngOnInit(): void {
    this.toolsService.getModulesMap().subscribe(
      (modulesMap) => (this.modulesMap = modulesMap),
      (err) => this.restErrorService.showError("failed to get modules", err)
    );

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
    this.sessionDataService.openDeleteFilesConfirm(this.selectionService.selectedDatasets);
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

  showJob() {
    this.selectionHandlerService.setJobSelection([this.sourceJob]);

    this.dialogModalService.openJobsModal(
      this.sessionDataService.getJobList(this.sessionData),
      this.tools,
      this.sessionData
    );
  }

  selectTool() {
    log.info("select tool", this.sourceTool, this.modulesMap);
    const module = this.modulesMap.get(this.sourceJob.module);
    log.info("found module", module);
    const category = module.categoriesMap.get(this.sourceJob.toolCategory);
    log.info("found category", category);

    this.toolSelectionService.selectTool(module, category, this.sourceTool);
  }

  selectToolAndParameters() {}

  selectChildren() {
    const children = this.getSessionDataService.getChildren(this.selectionService.selectedDatasets);
    this.selectionHandlerService.setDatasetSelection(children);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
