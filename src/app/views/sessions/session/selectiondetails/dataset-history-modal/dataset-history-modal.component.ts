import { Component, Input, OnChanges, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset, Job, JobInput, JobParameter } from "chipster-js-common";
import { SessionData } from "../../../../../model/session/session-data";
import { QuerySessionDataService } from "../../query-session-data.service";

export class DatasetHistoryStep {
  datasetName: string;
  date: string;
  sourceJobName: string;
  sourceJob: Job;
  parameterList: JobParameter[];
  inputFileNamesString: string;
  sourceCode: string;
}

interface HistoryOption {
  id: string;
  name: string;
  enabled: boolean;
}
@Component({
  selector: "ch-dataset-history-modal",
  templateUrl: "./dataset-history-modal.component.html",
  styleUrls: ["./dataset-history-modal.component.less"],
})
export class DatasetHistoryModalComponent implements OnInit, OnChanges {
  @Input() dataset: Dataset;
  @Input() sessionData: SessionData;

  public historyOptions: Array<HistoryOption> = [
    { id: "sourceJobName", name: "Tool", enabled: true },
    { id: "inputFileNames", name: "Input files", enabled: true },
    { id: "parameters", name: "Parameters", enabled: true },
    { id: "resultFileName", name: "Result file", enabled: true },
    { id: "date", name: "Date", enabled: true },
    { id: "stepTitle", name: "Step title", enabled: true },
    { id: "sourceCode", name: "Source code", enabled: false },
  ];

  public historyOptionsMap: Map<string, HistoryOption>;

  datasetHistorySteps: Array<DatasetHistoryStep> = [];

  constructor(public activeModal: NgbActiveModal, public querySessionDataService: QuerySessionDataService) {}

  ngOnInit(): void {
    this.historyOptionsMap = new Map();
    this.historyOptions.forEach((option) => this.historyOptionsMap.set(option.id, option));
    this.datasetHistorySteps = this.getHistoryData();
  }

  ngOnChanges(): void {
    this.datasetHistorySteps = this.getHistoryData();
  }

  updateOption(option: HistoryOption): void {
    option.enabled = !option.enabled;
  }

  private getHistoryData(): Array<DatasetHistoryStep> {
    const historySteps: Array<DatasetHistoryStep> = [this.dataset]
      .concat(this.querySessionDataService.getAncestorDatasetsBottomUpBreadthFirst(this.sessionData, this.dataset))
      .map((dataset) => {
        const sourceJob = this.sessionData.jobsMap.get(dataset.sourceJob);

        return {
          datasetName: dataset.name,
          date: sourceJob != null ? sourceJob.created : dataset.created,
          sourceJobName: sourceJob != null ? sourceJob.toolCategory + " / " + sourceJob.toolName : "not available",
          sourceJob: sourceJob,
          parameterList: sourceJob != null ? sourceJob.parameters : [],
          inputFileNamesString:
            sourceJob != null ? sourceJob.inputs.map((jobInput: JobInput) => jobInput.displayName).join(" ") : "",
          sourceCode: sourceJob != null ? sourceJob.sourceCode : null,
        };
      });

    // reverse the order of steps so that oldest comes first
    return historySteps.reverse();
  }
}
