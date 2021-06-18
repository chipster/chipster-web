import {
  Category,
  Dataset,
  InputBinding,
  Module,
  Tool,
} from "chipster-js-common";
import { PhenodataBinding } from "../../../../model/session/phenodata-binding";
import { SampleGroups } from "../dataset.service";

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
  singleJobInputsValidation: ValidationResult;
  phenodataValidation: ValidationResult;
  phenodataBindings: Array<PhenodataBinding>;
}

export interface SelectedToolWithValidatedParameters
  extends SelectedToolWithValidatedInputs {
  parametersValidation: ValidationResult;
  parametersValidationResults?: Map<string, ValidationResult>;
}

export interface ValidatedTool extends SelectedToolWithValidatedParameters {
  singleJobValidation: ValidationResult;
  runForEachValidation: ValidationResult;
  runForEachSampleValidation: ValidationResult;
  sampleGroups: SampleGroups;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}
