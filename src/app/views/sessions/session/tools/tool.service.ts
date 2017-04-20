import ToolParameter from "../../../../model/session/toolparameter";
import Dataset from "../../../../model/session/dataset";
import InputBinding from "../../../../model/session/inputbinding";
import Tool from "../../../../model/session/tool";
import ToolInput from "../../../../model/session/toolinput";
import {Injectable} from "@angular/core";
import {TypeTagService} from "../../../../shared/services/typetag.service";
import {SessionData} from "../../../../model/session/session-data";

@Injectable()
export class ToolService {

  constructor(
    private typeTagService: TypeTagService) {}

  //noinspection JSMethodCanBeStatic
  isSelectionParameter(parameter: ToolParameter) {
    return parameter.type === 'ENUM' ||
      parameter.type === 'COLUMN_SEL' ||
      parameter.type === 'METACOLUMN_SEL';
  };

  //noinspection JSMethodCanBeStatic
  isNumberParameter(parameter: ToolParameter) {
    return parameter.type === 'INTEGER' ||
      parameter.type === 'DECIMAL' ||
      parameter.type === 'PERCENT';
  };

  getDefaultValue(toolParameter: ToolParameter): number | string {
    if (this.isNumberParameter(toolParameter)) {
      return Number(toolParameter.defaultValue);
    }
    else {
      return toolParameter.defaultValue;
    }
  };

  //noinspection JSMethodCanBeStatic
  isCompatible(sessionData: SessionData, dataset: Dataset, type: string) {
    return this.typeTagService.isCompatible(sessionData, dataset, type);
  }


  bindInputs(sessionData: SessionData, tool: Tool, datasets: Dataset[]): InputBinding[] {

    // copy the array so that we can remove items from it
    let unboundDatasets = datasets.slice();

    // see OperationDefinition.bindInputs()

    let inputBindings: InputBinding[] = [];

    // go through inputs, optional inputs last
    for (let toolInput of tool.inputs.filter(input => !input.optional).concat(tool.inputs.filter(input => input.optional))) {

      // ignore phenodata input, it gets generated on server side TODO should we check that it exists?
      if (toolInput.meta) {
        continue;
      }

      // get compatible datasets
      let compatibleDatasets = unboundDatasets.filter(dataset => this.isCompatible(sessionData, dataset, toolInput.type.name));

      // if no compatible datasets found, binding gets empty datasets array
      let datasetsToBind: Dataset[] = [];
      if (compatibleDatasets.length > 0) {
        // pick the first or all if multi input
        datasetsToBind = this.isMultiInput(toolInput) ? compatibleDatasets : compatibleDatasets.slice(0,1);
      }

      inputBindings.push({
        toolInput: toolInput,
        datasets: datasetsToBind
      });

      let toolId = toolInput.name.id ? toolInput.name.id : toolInput.name.prefix + toolInput.name.postfix;
      console.log("binding", toolId, "->", datasetsToBind.reduce((a, b) => {
        return a + b.name + " " ;}, "").trim());

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
    return bindings && bindings.every(binding => binding.toolInput.optional || binding.datasets && binding.datasets.length > 0);
  }


  //noinspection JSMethodCanBeStatic
  isMultiInput(input: ToolInput) {
    return (input.name.prefix && input.name.prefix.length > 0) ||
      (input.name.postfix && input.name.postfix.length > 0);
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

}
