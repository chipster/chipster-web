import {
  Tool,
  InputBinding,
  Category,
  Module,
  Dataset
} from "chipster-js-common";
import { PhenodataBinding } from "../../../../model/session/phenodata-binding";

export interface SelectedTool {
  tool: Tool;
  category: Category;
  module: Module;
}

export interface SelectedToolWithInputs extends SelectedTool {
  inputBindings: Array<InputBinding>;
  selectedDatasets: Array<Dataset>;
}

export interface SelectedToolWithValidatedInputs
  extends SelectedToolWithInputs {
  inputsValid: boolean;
  runForEachValid: boolean;
  phenodataValid: boolean;
  phenodataBindings: Array<PhenodataBinding>;
}
export interface ValidatedTool extends SelectedToolWithValidatedInputs {
  valid: boolean;
  parametersValid: boolean;
  message?: string;
  parameterResults?: Map<string, ParameterValidationResult>;
}

export interface ParameterValidationResult {
  valid: boolean;
  message?: string;
}
