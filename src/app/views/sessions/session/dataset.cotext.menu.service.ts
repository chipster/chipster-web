import { Injectable } from "@angular/core";
import { Dataset, Job, Tool } from "chipster-js-common";
import { SessionData } from "../../../model/session/session-data";
import { DialogModalService } from "./dialogmodal/dialogmodal.service";
import { SelectionHandlerService } from "./selection-handler.service";
import { SessionDataService } from "./session-data.service";
import { ToolSelectionService } from "./tool.selection.service";
import { ToolService } from "./tools/tool.service";

@Injectable()
export class DatasetContextMenuService {
  constructor(
    private sessionDataService: SessionDataService,
    private toolService: ToolService,
    private selectionHandlerService: SelectionHandlerService,
    private dialogModalService: DialogModalService,
    private toolSelectionService: ToolSelectionService
  ) {}

  getSourceJob(datasets: Dataset[], jobsMap: Map<string, Job>): Job {
    if (datasets.length === 1) {
      return this.sessionDataService.getJobById(datasets[0].sourceJob, jobsMap);
    }
    return null;
  }

  getSoureTool(job: Job, tools: Tool[]): Tool {
    return this.toolService.getLiveToolForSourceJob(job, tools);
  }

  showJob(job: Job, tools: Tool[], sessionData: SessionData) {
    this.selectionHandlerService.setJobSelection([job]);

    this.dialogModalService.openJobsModal(this.sessionDataService.getJobList(sessionData), tools, sessionData);
  }

  selectTool(job: Job) {
    this.toolSelectionService.selectToolById(job.module, job.toolCategory, job.toolId);
  }
}
