import { Category, Dataset, InputBinding, Module, Tool } from "chipster-js-common";
import { PhenodataBinding } from "../../../../model/session/phenodata-binding";
import { SampleGroups } from "../dataset.service";

export interface SelectedToolById {
  toolId: string;
  categoryName: string;
  moduleId: string;
}
export interface SelectedTool {
  tool: Tool;
  category: Category;
  module: Module;
}

export interface SelectedToolWithInputs extends SelectedTool {
  inputBindings: Array<InputBinding>;
  selectedDatasets: Array<Dataset>;
}

export interface SelectedToolWithValidatedInputs extends SelectedToolWithInputs {
  singleJobInputsValidation: ValidationResult;
  phenodataValidation: ValidationResult;
  phenodataBindings: Array<PhenodataBinding>;
}

export interface SelectedToolWithValidatedParameters extends SelectedToolWithValidatedInputs {
  parametersValidation: ValidationResult;
  parametersValidationResults?: Map<string, ValidationResult>;
  // place for storing the customized resources in the next stage. Should we create a separate stage for this?
  resources: ToolResources;
}

export interface SelectedToolWithValidatedResources extends SelectedToolWithValidatedParameters {
  resourcesValidation: ValidationResult;
  resourcesValidationResults?: Map<string, ValidationResult>;
}
export interface ToolResources {
  slotCount: number;
}

export interface ValidatedTool extends SelectedToolWithValidatedResources {
  singleJobValidation: ValidationResult;
  runForEachValidation: ValidationResult;
  runForEachSampleValidation: ValidationResult;
  sampleGroups: SampleGroups;
}
export interface ValidationResult {
  valid: boolean;
  message?: string;
}
