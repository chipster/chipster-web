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
  inputsValid: boolean;
  inputsMessage?: string;
  runForEachValid: boolean;
  runForEachSampleValid: boolean;
  sampleGroups: SampleGroups;
  phenodataValid: boolean;
  phenodataMessage?: string;
  phenodataBindings: Array<PhenodataBinding>;
}
export interface ValidatedTool extends SelectedToolWithValidatedInputs {
  valid: boolean;
  parametersValid: boolean;
  message?: string;
  parameterResults?: Map<string, ValidationResult>;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}
