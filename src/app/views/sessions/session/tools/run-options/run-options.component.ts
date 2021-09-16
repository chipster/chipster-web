import { Component, Input, OnChanges } from "@angular/core";
import { SessionData } from "../../../../../model/session/session-data";
import { ToolService } from "../tool.service";
import { ValidatedTool } from "../ToolSelection";

@Component({
  selector: "ch-run-options",
  templateUrl: "./run-options.component.html",
  styleUrls: ["./run-options.component.less"],
})
export class RunOptionsComponent implements OnChanges {
  @Input() sessionData: SessionData;
  @Input() validatedTool: ValidatedTool;

  ready = false;

  constructor(private toolService: ToolService) {}

  ngOnChanges() {
    if (this.validatedTool != null) {
      this.ready = true;
    } else {
      this.ready = false;
    }
  }

  getRunSingleDescription(): string {
    if (this.validatedTool.singleJobValidation.valid === true) {
      if (this.validatedTool.tool.inputs.length === 0 || this.validatedTool.inputBindings.length === 0) {
        return "Runs the tool once.";
      } else if (this.validatedTool.selectedDatasets.length === 1) {
        return "Runs the tool once. Uses the one selected file as the tool input.";
      } else if (this.validatedTool.selectedDatasets.length > 1) {
        return (
          "Runs the tool once. Uses all the " +
          this.validatedTool.selectedDatasets.length +
          " selected files as the tool inputs."
        );
      }
    } else {
      return this.validatedTool.singleJobValidation.message;
    }
  }

  getRunForEachSampleDescription(): string {
    if (this.validatedTool.runForEachSampleValidation.valid === true) {
      const runsTheTool = "Runs the tool ";

      const middlePart =
        this.validatedTool.sampleGroups.pairedEndSamples.length > 0
          ? this.validatedTool.sampleGroups.pairedEndSamples.length +
            " times. Each time the two paired files of a one sample are used as the tool inputs. "
          : this.validatedTool.sampleGroups.singleEndSamples.length +
            " times. Each time the single end sample file is used as the tool input. ";

      const nonSampleFiles =
        this.validatedTool.sampleGroups.sampleDataMissing.length > 0
          ? "Selected files include the following non-sample files that are used as additional tool inputs files for all the tool runs: " +
            this.validatedTool.sampleGroups.sampleDataMissing.map((dataset) => dataset.name).join(", ") +
            "."
          : "";
      return runsTheTool + middlePart + nonSampleFiles;
    } else {
      return this.validatedTool.runForEachSampleValidation.message;
    }
  }
}
