import ToolParameter from "../../../../model/session/toolparameter";
import Dataset from "../../../../model/session/dataset";
import InputBinding from "../../../../model/session/inputbinding";
import Tool from "../../../../model/session/tool";
import ToolInput from "../../../../model/session/toolinput";
import { Injectable } from "@angular/core";
import { TypeTagService } from "../../../../shared/services/typetag.service";
import { SessionData } from "../../../../model/session/session-data";
import { Observable } from "rxjs";
import { SessionDataService } from "../sessiondata.service";
import { TSVReader } from "../../../../shared/services/TSVReader";
import * as _ from "lodash";
import { ConfigService } from "../../../../shared/services/config.service";

@Injectable()
export class ToolService {
  constructor(
    private typeTagService: TypeTagService,
    private sessionDataService: SessionDataService,
    private tsvReader: TSVReader,
    private configService: ConfigService
  ) {}

  //noinspection JSMethodCanBeStatic
  isSelectionParameter(parameter: ToolParameter) {
    return (
      parameter.type === "ENUM" ||
      parameter.type === "COLUMN_SEL" ||
      parameter.type === "METACOLUMN_SEL"
    );
  }

  //noinspection JSMethodCanBeStatic
  isNumberParameter(parameter: ToolParameter) {
    return (
      parameter.type === "INTEGER" ||
      parameter.type === "DECIMAL" ||
      parameter.type === "PERCENT"
    );
  }

  //noinspection JSMethodCanBeStatic
  /**
   * Get the step size for number inputs
   *
   * Giving the correct step size helps a browser to set the correct width for the decimal inputs.
   * It also makes the up/down buttons slightly less useless.
   *
   * @param {ToolParameter} parameter
   * @returns {number}
   */
  getStepSize(parameter: ToolParameter) {
    if (parameter.type === "PERCENT") {
      // not used much, but used to be round figures in the old Java client
      return 0.01;
    } else if (parameter.type === "DECIMAL") {
      // the same number of decimal places than the default value has
      if (
        parameter.defaultValue &&
        parameter.defaultValue.indexOf(".") !== -1
      ) {
        const decimalPlaces = parameter.defaultValue.split(".")[1].length;
        return Math.pow(0.1, decimalPlaces);
      } else {
        // default value missing or does not have a decimal point
        return 0.001;
      }
    }

    // integer parameters
    return 1;
  }

  getDefaultValue(toolParameter: ToolParameter): number | string {
    if (this.isNumberParameter(toolParameter)) {
      return Number(toolParameter.defaultValue);
    } else {
      return toolParameter.defaultValue;
    }
  }

  //noinspection JSMethodCanBeStatic
  isDefaultValue(parameter: ToolParameter, value: number | string) {
    return parameter.defaultValue && parameter.defaultValue === value;
  }

  //noinspection JSMethodCanBeStatic
  isCompatible(sessionData: SessionData, dataset: Dataset, type: string) {
    return this.typeTagService.isCompatible(sessionData, dataset, type);
  }

  bindInputs(
    sessionData: SessionData,
    tool: Tool,
    datasets: Dataset[]
  ): InputBinding[] {
    // copy the array so that we can remove items from it
    let unboundDatasets = datasets.slice();

    // see OperationDefinition.bindInputs()

    const inputBindings: InputBinding[] = [];

    // go through inputs, optional inputs last
    for (const toolInput of tool.inputs
      .filter(input => !input.optional)
      .concat(tool.inputs.filter(input => input.optional))) {
      // ignore phenodata input, it gets generated on server side TODO should we check that it exists?
      if (toolInput.meta) {
        continue;
      }

      // get compatible datasets
      const compatibleDatasets = unboundDatasets.filter(dataset =>
        this.isCompatible(sessionData, dataset, toolInput.type.name)
      );

      // if no compatible datasets found, binding gets empty datasets array
      let datasetsToBind: Dataset[] = [];
      if (compatibleDatasets.length > 0) {
        // pick the first or all if multi input
        datasetsToBind = this.isMultiInput(toolInput)
          ? compatibleDatasets
          : compatibleDatasets.slice(0, 1);
      }

      inputBindings.push({
        toolInput: toolInput,
        datasets: datasetsToBind
      });

      const toolId = toolInput.name.id
        ? toolInput.name.id
        : toolInput.name.prefix + toolInput.name.postfix;
      console.log(
        "binding",
        toolId,
        "->",
        datasetsToBind
          .reduce((a, b) => {
            return a + b.name + " ";
          }, "")
          .trim()
      );

      // remove bound datasets from unbound
      unboundDatasets = _.difference(unboundDatasets, datasetsToBind);
    }

    return inputBindings;
  }

  //noinspection JSMethodCanBeStatic
  /**
   *
   * @param bindings
   * @returns {boolean} false if bindings is falsy, true if given array is empty or if every non optional input has
   * at least one dataset bound
   */
  checkBindings(bindings: InputBinding[]): boolean {
    return (
      bindings &&
      bindings.every(
        binding =>
          binding.toolInput.optional ||
          (binding.datasets && binding.datasets.length > 0)
      )
    );
  }

  //noinspection JSMethodCanBeStatic
  isMultiInput(input: ToolInput) {
    return (
      (input.name.prefix && input.name.prefix.length > 0) ||
      (input.name.postfix && input.name.postfix.length > 0)
    );
  }

  /** Return the id of the nth input instance of multi input
   *
   * E.g. microarray{...}.cel getMultiInputId(2) will return microarray003.cel
   *
   * NOTE: name indexing starts from 1, getMultiInputId(0) will return the first
   * multi input instance, which will be microarray001.cel
   *
   * NOTE: number is padded with zeros to always contain at least 3 digits
   *
   */
  getMultiInputId(input: ToolInput, index: number): string {
    if (!this.isMultiInput(input)) {
      return null;
    }

    // pad with zeros to three digits
    let digits: string = "" + index;
    if (digits.length < 3) {
      while (digits.length < 3) {
        digits = "0" + digits;
      }
    }

    return input.name.prefix + digits + input.name.postfix;
  }

  //noinspection JSMethodCanBeStatic
  selectionOptionsContains(options: any[], value: string | number) {
    for (const option of options) {
      if (value === option.id) {
        return true;
      }
    }
    return false;
  }

  //noinspection JSMethodCanBeStatic
  getDatasetHeaders(datasets: Array<Dataset>): Observable<Array<string>>[] {
    return datasets.map((dataset: Dataset) =>
      this.tsvReader.getTSVFileHeaders(
        this.sessionDataService.getSessionId(),
        dataset
      )
    );
  }

  //noinspection JSMethodCanBeStatic
  getMetadataColumns(datasets: Array<Dataset>) {
    const keySet = new Set();
    for (const dataset of datasets) {
      for (const entry of dataset.metadata) {
        keySet.add(entry.key);
      }
    }
    return Array.from(keySet);
  }

  getManualPage(toolId: string) {
    return this.configService.getManualToolPostfix().map(manualPostfix => {
      if (toolId.endsWith(".java")) {
        // remove the java package name
        const splitted = toolId.split(".");
        if (splitted.length > 2) {
          // java class name
          return splitted[splitted.length - 2] + manualPostfix;
        }
      } else {
        for (const ext of [".R", ".py"]) {
          if (toolId.endsWith(ext)) {
            return toolId.slice(0, -1 * ext.length) + manualPostfix;
          }
        }
      }
      return toolId;
    });
  }
}
