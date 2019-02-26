import {
  Tool,
  InputBinding,
  Category,
  Module,
  Dataset
} from "chipster-js-common";

export interface SelectedTool {
  tool: Tool;
  category: Category;
  module: Module;
}

export interface SelectedToolWithInputs {
  tool: Tool;
  category: Category;
  module: Module;
  inputBindings: Array<InputBinding>;
  selectedDatasets: Array<Dataset>;
}

export interface SelectedToolWithValidatedInputs {
  tool: Tool;
  category: Category;
  module: Module;
  inputBindings: Array<InputBinding>;
  selectedDatasets: Array<Dataset>;
  inputsValid: boolean;
  runForEachValid: boolean;
}
export interface ValidatedTool {
  tool: Tool;
  category: Category;
  module: Module;
  inputBindings: Array<InputBinding>;
  selectedDatasets: Array<Dataset>;
  valid: boolean;
  parametersValid: boolean;
  inputsValid: boolean;
  runForEachValid: boolean;
  message?: string;
  parameterResults?: Map<string, ParameterValidationResult>;
}

export interface ParameterValidationResult {
  valid: boolean;
  message?: string;
}
