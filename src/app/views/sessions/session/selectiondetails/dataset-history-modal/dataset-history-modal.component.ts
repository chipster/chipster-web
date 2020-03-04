import { Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset, Job, JobInput, JobParameter } from "chipster-js-common";
import { SessionData } from "../../../../../model/session/session-data";

export class DatasetHistoryStep {
  datasetName: string;
  creationDate: string;
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
  styleUrls: ["./dataset-history-modal.component.less"]
})
export class DatasetHistorymodalComponent implements OnInit {
  @Input() dataset: Dataset;
  @Input() sessionData: SessionData;

  public historyOptions: Array<HistoryOption> = [
    { id: "sourceJobName", name: "Tool", enabled: true },
    { id: "inputFileNames", name: "Input files", enabled: true },
    { id: "parameters", name: "Parameters", enabled: true },
    { id: "resultFileName", name: "Result file", enabled: true },
    { id: "date", name: "Date", enabled: true },
    { id: "stepTitle", name: "Step title", enabled: true },
    { id: "sourceCode", name: "Source code", enabled: false }
  ];

  public historyOptionsMap: Map<string, HistoryOption>;

  stepCount: number;
  datasetHistorySteps: Array<DatasetHistoryStep> = [];

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    this.historyOptionsMap = new Map();
    this.historyOptions.forEach(option =>
      this.historyOptionsMap.set(option.id, option)
    );

    this.stepCount = 0;
    this.getHistoryData();
  }

  updateOption(option: HistoryOption): void {
    option.enabled = !option.enabled;
  }

  getHistoryData(): void {
    // TODO refactor

    let sourceJobId: string = this.dataset.sourceJob;
    let datasetId: string = this.dataset.datasetId;
    let curSourceJob: Job;

    // if this is not the first input dataset, otherwise sourceJob is null or
    // there will be no input file, so we need to check both

    while (
      this.sessionData.datasetsMap.has(datasetId) &&
      this.sessionData.jobsMap.has(sourceJobId) &&
      this.sessionData.jobsMap.get(sourceJobId).inputs.length > 0
    ) {
      const curStepDetail: DatasetHistoryStep = new DatasetHistoryStep();
      // Populate history data
      curSourceJob = this.sessionData.jobsMap.get(sourceJobId);
      curStepDetail.datasetName = this.sessionData.datasetsMap.get(
        datasetId
      ).name;
      curStepDetail.creationDate = this.sessionData.session.created;
      curStepDetail.sourceJob = curSourceJob;
      curStepDetail.sourceJobName = curSourceJob.toolName;
      curStepDetail.parameterList = curSourceJob.parameters;
      curStepDetail.inputFileNamesString = curSourceJob.inputs
        .map((jobInput: JobInput) => jobInput.displayName)
        .join(" ");
      curStepDetail.sourceCode = curSourceJob.sourceCode;
      this.datasetHistorySteps[this.stepCount] = curStepDetail;
      this.stepCount++;

      datasetId = this.sessionData.jobsMap.get(sourceJobId).inputs[0].datasetId;
      sourceJobId = this.sessionData.datasetsMap.get(datasetId).sourceJob;
    }

    // Reverse the order of steps so that it shows analysis history from root to leaf
    this.datasetHistorySteps.reverse();
  }
}
