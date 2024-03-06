import { Injectable } from "@angular/core";
import { Dataset, InputBinding, Job, Tool, ToolInput, ToolParameter } from "chipster-js-common";
import { difference } from "lodash-es";
import { Observable, of } from "rxjs";
import { map, tap } from "rxjs/operators";
import { PhenodataBinding } from "../../../../model/session/phenodata-binding";
import { SessionData } from "../../../../model/session/session-data";
import { ConfigService } from "../../../../shared/services/config.service";
import { TsvService } from "../../../../shared/services/tsv.service";
import { TypeTagService } from "../../../../shared/services/typetag.service";
import { GetSessionDataService } from "../get-session-data.service";
import { SelectionOption } from "../SelectionOption";
import { SessionDataService } from "../session-data.service";
import { SelectedToolWithInputs } from "./ToolSelection";

@Injectable()
export class ToolService {
  constructor(
    private typeTagService: TypeTagService,
    private sessionDataService: SessionDataService,
    private tsvService: TsvService,
    private configService: ConfigService,
    private getSessionDataService: GetSessionDataService,
  ) {}

  isSelectionParameter(parameter: ToolParameter) {
    return parameter.type === "ENUM" || parameter.type === "COLUMN_SEL" || parameter.type === "METACOLUMN_SEL";
  }

  isColumnSelectionParameter(parameter: ToolParameter) {
    return parameter.type === "COLUMN_SEL" || parameter.type === "METACOLUMN_SEL";
  }

  isNumberParameter(parameter: ToolParameter) {
    return parameter.type === "INTEGER" || parameter.type === "DECIMAL" || parameter.type === "PERCENT";
  }

  isStringParameter(parameter: ToolParameter) {
    return parameter.type === "STRING" || parameter.type === "UNCHECKED_STRING";
  }

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
    }
    if (parameter.type === "DECIMAL") {
      // the same number of decimal places than the default value has
      if (parameter.defaultValue && parameter.defaultValue.includes(".")) {
        const decimalPlaces = parameter.defaultValue.split(".")[1].length;
        return 0.1 ** decimalPlaces;
      }
      // default value missing or does not have a decimal point
      return 0.001;
    }

    // integer parameters
    return 1;
  }

  getDefaultValue(toolParameter: ToolParameter): number | string {
    if (toolParameter.defaultValue != null && this.isNumberParameter(toolParameter)) {
      return Number(toolParameter.defaultValue);
    }
    return toolParameter.defaultValue;
  }

  isDefaultValue(parameter: ToolParameter, value: number | string) {
    // no default value
    if (parameter.defaultValue == null || parameter.defaultValue === "EMPTY") {
      // if the default is not set, allow also null, undefined and empty string here
      return this.isColumnSelectionParameter(parameter) ? value == null : value == null || String(value).trim() === "";
    }

    // default value, but no value

    // Comment : the parameter.value is either null or undefined all the time, should we set it somewhere?
    // for this condition parameter never changes color
    if (value == null || String(value).trim() === "") {
      return false;
    }

    // value must match default value
    if (parameter.type === "DECIMAL" || parameter.type === "PERCENT") {
      // consider "0" and "0.0" equal
      return parseFloat(value.toString()) === parseFloat(parameter.defaultValue);
    }
    return parameter.defaultValue === String(value).trim();
  }

  isCompatible(sessionData: SessionData, dataset: Dataset, type: string) {
    return this.typeTagService.isCompatible(sessionData, dataset, type);
  }

  bindInputs(sessionData: SessionData, tool: Tool, datasets: Dataset[]): InputBinding[] {
    // copy the array so that we can remove items from it
    let unboundDatasets = datasets.slice();

    // sort inputs to determine binding order, also filter out phenodata inputs
    const inputs: ToolInput[] = this.getInputsSortedForBinding(tool).filter((input: ToolInput) => !input.meta);

    // temp map
    const bindingsMap = new Map<ToolInput, Dataset[]>();

    // do the binding, one input at a time
    inputs.forEach((toolInput) => {
      // get compatible datasets
      const compatibleDatasets = unboundDatasets.filter((dataset) =>
        this.isCompatible(sessionData, dataset, toolInput.type.name),
      );

      // if no compatible datasets found, binding gets empty datasets array
      let datasetsToBind: Dataset[] = [];
      if (compatibleDatasets.length > 0) {
        // pick the first or all if multi input
        datasetsToBind = this.isMultiInput(toolInput) ? compatibleDatasets : compatibleDatasets.slice(0, 1);
      }

      // save binding
      bindingsMap.set(toolInput, datasetsToBind);

      // remove bound datasets from unbound
      unboundDatasets = difference(unboundDatasets, datasetsToBind);
    });

    // return bindings in the same order as the original tool input, skip phenodata
    return tool.inputs
      .filter((input: ToolInput) => !input.meta)
      .map((toolInput: ToolInput) => ({
        toolInput,
        datasets: bindingsMap.get(toolInput),
      }));
  }

  bindPhenodata(toolWithInputs: SelectedToolWithInputs): PhenodataBinding[] {
    // if no phenodata inputs, return empty array
    const phenodataInputs = toolWithInputs.tool.inputs.filter((input) => input.meta);
    if (phenodataInputs.length === 0) {
      return [];
    }

    // for now, if tool has multiple phenodata inputs, don't try to bind anything
    // i.e. return array with phenodata inputs but no bound datasets
    if (phenodataInputs.length > 1) {
      return this.getUnboundPhenodataBindings(toolWithInputs);
    }

    // try to bind the first (and only, see above) phenodata input
    const firstPhenodataInput = phenodataInputs[0];

    // get all input datasets and see if phenodata can be found for any of them
    const phenodataDataset = toolWithInputs.inputBindings
      // get all inputs
      .reduce((allInputs, binding) => allInputs.concat(binding.datasets), [])
      // get phenodatas for the inputs
      .map((inputDataset) => this.getSessionDataService.getPhenodataDataset(inputDataset))
      // pick first where phenodata found
      .find((dataset) => dataset != null);

    return [
      {
        toolInput: firstPhenodataInput,
        dataset: phenodataDataset,
      },
    ];
  }

  getUnboundPhenodataBindings(toolWithInputs: SelectedToolWithInputs): PhenodataBinding[] {
    // if no phenodata inputs, return empty array
    return toolWithInputs.tool.inputs
      .filter((input) => input.meta)
      .map((input) => ({ toolInput: input, dataset: null }));
  }

  /**
   *
   * @param bindings
   * @returns {boolean} false if bindings is falsy, true if given array is empty or if every non optional input has
   * at least one dataset bound
   */
  checkBindings(bindings: InputBinding[]): boolean {
    return (
      bindings &&
      bindings.every((binding) => binding.toolInput.optional || (binding.datasets && binding.datasets.length > 0))
    );
  }

  isMultiInput(input: ToolInput) {
    return (input.name.prefix && input.name.prefix.length > 0) || (input.name.postfix && input.name.postfix.length > 0);
  }

  hasMultiInputs(tool: Tool) {
    return tool.inputs != null && tool.inputs.some((toolInput) => this.isMultiInput(toolInput));
  }

  getInputCountWithoutPhenodata(tool: Tool) {
    return tool.inputs.filter((toolInput) => !toolInput.meta).length;
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
    let digits: string = "" + (index + 1);
    if (digits.length < 3) {
      while (digits.length < 3) {
        digits = "0" + digits;
      }
    }

    return input.name.prefix + digits + input.name.postfix;
  }

  selectionOptionsContains(options: any[], value: string | number) {
    return options.some((option) => value === option.id);
  }

  getDatasetHeadersForParameter(
    datasets: Array<Dataset>,
    sessionData: SessionData,
  ): Array<Observable<Array<SelectionOption>>> {
    return datasets.map((dataset: Dataset): Observable<Array<SelectionOption>> => {
      /*
      Cache file headers

      When a tool with COLUMN_SEL parameter is selected, parameter panel must read
      column titles of all selected tsv files to find out the parameter options. When user
      has selected dozens of tsv files, this function is called every time the dataset 
      selection is changed.

      Without this caching, this would cause a request to file-broker for each dataset.

      The cache is stored in sessionData, which get's cleared only when user opens another 
      session. This shouldn't be a problem for now, when file contents are immutable. 
      If the file contents may change in the future, this cache should be probably cleared too.
      */
      if (sessionData.cachedFileHeaders.has(dataset.datasetId)) {
        return of(sessionData.cachedFileHeaders.get(dataset.datasetId));
      }

      return this.tsvService
        .getTSV2FileHeaders(dataset, sessionData)
        .pipe(tap((headers) => sessionData.cachedFileHeaders.set(dataset.datasetId, headers)));
    });
  }

  getMetadataColumns(phenodatas: Array<string>) {
    const headers = phenodatas.reduce(
      (allColumns: string[], phenodataString: string) =>
        allColumns.concat(this.tsvService.getTSVHeaders(phenodataString)),
      [],
    );

    // return unique headers
    return Array.from(new Set(headers));
  }

  getManualPage(toolId: string) {
    return this.configService.getManualToolPostfix().pipe(
      map((manualPostfix) => {
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
      }),
    );
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
        .filter((input) => !input.optional && !(input.type.name === "GENERIC") && !input.meta)
        // add optional not generic
        .concat(tool.inputs.filter((input) => input.type.name !== "GENERIC" && input.optional))
        // add mandatory generic
        .concat(tool.inputs.filter((input) => input.type.name === "GENERIC" && !input.optional))
        // add optional generic
        .concat(tool.inputs.filter((input) => input.type.name === "GENERIC" && input.optional))
    );
  }

  // noinspection JSMethodCanBeStatic
  getBindingsString(bindings: InputBinding[]) {
    let s = "";
    if (!bindings || bindings.length < 1) {
      return s;
    }

    for (const binding of bindings) {
      s += "\t";
      const datasetsString: string = binding.datasets.reduce((a: string, b) => a + b.name + " ", "");

      s += binding.toolInput.name.id ? binding.toolInput.name.id : binding.toolInput.name.prefix;
      s += " -> " + datasetsString;
      s += "\n";
    }

    return s;
  }

  getLiveToolForSourceJob(sourceJob: Job, tools: Tool[]): Tool {
    if (sourceJob != null) {
      const tool = tools.find((t) => t.name.id === sourceJob.toolId);
      return tool !== undefined ? tool : null;
    }
    return null;
  }
}
