import { Component, Input, OnChanges, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset, Job, JobInput, JobParameter, Tool } from "chipster-js-common";
import * as FileSaver from "file-saver";
import { ErrorService } from "../../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../../model/session/session-data";
import { QuerySessionDataService } from "../../query-session-data.service";
import { SessionDataService } from "../../session-data.service";
import { ToolService } from "../../tools/tool.service";

export class DatasetHistoryStep {
  datasetName: string;
  date: string;
  sourceJobName: string;
  sourceJob: Job;
  tool: Tool;
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
  @Input() private tools: Tool[];

  public historyOptions: Array<HistoryOption> = [
    { id: "sourceJobName", name: "Tool", enabled: true },
    { id: "parameters", name: "Parameters", enabled: true },
    { id: "inputFileNames", name: "Input files", enabled: true },
    { id: "resultFileName", name: "Result file", enabled: true },
    { id: "date", name: "Date", enabled: true },
    { id: "stepTitle", name: "Step title", enabled: true },
    { id: "sourceCode", name: "Source code", enabled: false },
  ];

  public historyOptionsMap: Map<string, HistoryOption>;

  datasetHistorySteps: Array<DatasetHistoryStep> = [];

  constructor(
    public activeModal: NgbActiveModal,
    public querySessionDataService: QuerySessionDataService,
    public toolService: ToolService,
    public sessionDataService: SessionDataService,
    public errorService: ErrorService
  ) { }

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

  downloadAsTextFile() {
    // check browser support
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const isFileSaverSupported = !!new Blob();
    } catch (e) {
      this.errorService.showSimpleError("Not supported", "Save as text file not supported by your web browser.");
      return;
    }

    const blob = new Blob([this.getHistoryAsString()], { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, "history-" + this.dataset.name + "-" + this.dataset.datasetId + ".txt");
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.getHistoryAsString()).then(
      () => {
        // success
      },
      () => {
        // fail
        this.errorService.showSimpleError("Copy to clipboard failed", "");
      }
    );
  }

  private getHistoryAsString(): string {
    const line = "----------------------------------------------------------------------------\n";
    const doubleLine = "============================================================================\n";

    const header = "History of " + this.dataset.name + "\n" + doubleLine + "\n";

    const steps: string = this.getHistoryData().reduce((s: string, step: DatasetHistoryStep, i) => {
      // tool
      const toolString =
        (this.historyOptionsMap.get("sourceJobName").enabled
          ? this.historyOptionsMap.get("sourceJobName").name + ": " + step.sourceJobName
          : "") + "\n";

      // input files
      let inputFilesString = "";

      if (this.historyOptionsMap.get("inputFileNames").enabled) {
        inputFilesString += this.historyOptionsMap.get("inputFileNames").name + ":\n";

        // sourceJob is null for uploaded files
        if (step.sourceJob) {
          inputFilesString +=

            step.sourceJob.inputs.reduce((inputs: string, input: JobInput) => {

              console.log("input", input);
              // jobs until 11/2023 have datasetName in input.displayName
              if (input.datasetName == null) {
                return inputs + "\t" + input.inputId + ": " + input.displayName + "\n";
              }
              if (input.displayName != null) {
                return inputs + "\t" + input.displayName + ": " + input.datasetName + "\n";
              }
              return inputs + "\t" + input.inputId + ": " + input.datasetName + "\n";
            }, "")
        }

        inputFilesString += "\n";
      }

      // parameters
      const parametersString =
        (this.historyOptionsMap.get("parameters").enabled
          ? this.historyOptionsMap.get("parameters").name +
          ":\n" +
          step.parameterList.reduce(
            (params: string, param: JobParameter) => params + "\t" + param.displayName + ": " + param.value + "\n",
            ""
          )
          : "") + "\n";

      // date
      const dateString =
        (this.historyOptionsMap.get("date").enabled ? this.historyOptionsMap.get("date").name + ": " + step.date : "") +
        "\n";

      // result file
      const resultFileString =
        (this.historyOptionsMap.get("resultFileName").enabled
          ? this.historyOptionsMap.get("resultFileName").name + ": " + step.datasetName
          : "") + "\n";

      // source code TODO pad with tabs
      const sourceCodeString =
        (this.historyOptionsMap.get("sourceCode").enabled
          ? this.historyOptionsMap.get("sourceCode").name +
          ":\n" +
          (step.sourceCode != null ? step.sourceCode : "not available").replace(/^/gm, "\t")
          : "") + "\n";

      const stepString =
        "Step " +
        (i + 1) +
        "\n" +
        line +
        toolString +
        inputFilesString +
        parametersString +
        dateString +
        resultFileString +
        sourceCodeString +
        "\n\n\n";
      return s + stepString;
    }, "");

    return header + steps;
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
          sourceJob,
          parameterList: sourceJob != null ? sourceJob.parameters : [],
          inputFileNamesString:
            sourceJob != null ? sourceJob.inputs.map((jobInput: JobInput) => jobInput.displayName).join(" ") : "",
          sourceCode: sourceJob != null ? sourceJob.sourceCode : null,
          tool: this.toolService.getLiveToolForSourceJob(sourceJob, this.tools),
        };
      });

    // reverse the order of steps so that oldest comes first
    return historySteps.reverse();
  }
}
