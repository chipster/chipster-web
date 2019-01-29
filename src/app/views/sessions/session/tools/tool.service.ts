import {
  ToolParameter,
  Dataset,
  InputBinding,
  Tool,
  ToolInput
} from "chipster-js-common";
import { Injectable } from "@angular/core";
import { TypeTagService } from "../../../../shared/services/typetag.service";
import { SessionData } from "../../../../model/session/session-data";
import { Observable } from "rxjs";
import { SessionDataService } from "../session-data.service";
import { TSVReader } from "../../../../shared/services/TSVReader";
import * as _ from "lodash";
import { ConfigService } from "../../../../shared/services/config.service";
import log from "loglevel";

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
  isColumnSelectionParameter(parameter: ToolParameter) {
    return (
      parameter.type === "COLUMN_SEL" || parameter.type === "METACOLUMN_SEL"
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
  isStringParameter(parameter: ToolParameter) {
    return parameter.type === "STRING" || parameter.type === "UNCHECKED_STRING";
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
    if (
      toolParameter.defaultValue != null &&
      this.isNumberParameter(toolParameter)
    ) {
      return Number(toolParameter.defaultValue);
    } else {
      return toolParameter.defaultValue;
    }
  }

  //noinspection JSMethodCanBeStatic
  isDefaultValue(parameter: ToolParameter, value: number | string) {
    // no default value
    if (parameter.defaultValue == null) {
      // if the default is not set, allow also null, undefined and empty string here
      return value == null || String(value).trim() === "";
    }

    // default value, but no value
    if (parameter.value == null || String(parameter.value).trim() === "") {
      return false;
    }

    // value must match default value
    if (parameter.type === "DECIMAL" || parameter.type === "PERCENT") {
      // consider "0" and "0.0" equal
      return (
        parseFloat(value.toString()) === parseFloat(parameter.defaultValue)
      );
    } else {
      return parameter.defaultValue === String(value).trim();
    }
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

    // sort inputs to determine binding order
    const inputs: ToolInput[] = this.getInputsSortedForBinding(tool);

    // temp map
    const bindingsMap = new Map<ToolInput, Dataset[]>();

    // do the binding, one input at a time
    for (const toolInput of inputs) {
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

      // save binding
      bindingsMap.set(toolInput, datasetsToBind);

      // remove bound datasets from unbound
      unboundDatasets = _.difference(unboundDatasets, datasetsToBind);
    }

    // return bindings in the same order as the original tool inputs
    return tool.inputs.map((toolInput: ToolInput) => {
      return {
        toolInput: toolInput,
        datasets: bindingsMap.get(toolInput)
      };
    });
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

  getDisplayName(obj: ToolParameter | ToolInput | Tool) {
    if (obj.name.spliced && obj.name.displayName == null) {
      return obj.name.prefix + obj.name.postfix;
    }

    if (obj.name.displayName != null) {
      return obj.name.displayName;
    }
    return obj.name.id;
  }

  getInputsSortedForBinding(tool: Tool): ToolInput[] {
    return (
      tool.inputs
        // start with mandatory not generic, ignore phenodata
        .filter(
          input =>
            !input.optional && !(input.type.name === "GENERIC") && !input.meta
        )
        // add optional not generic
        .concat(
          tool.inputs.filter(
            input => input.type.name !== "GENERIC" && input.optional
          )
        )
        // add mandatory generic
        .concat(
          tool.inputs.filter(
            input => input.type.name === "GENERIC" && !input.optional
          )
        )
        // add optional generic
        .concat(
          tool.inputs.filter(
            input => input.type.name === "GENERIC" && input.optional
          )
        )
    );
  }
}
