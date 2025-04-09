import {
  SelectedTool,
  SelectedToolById,
  SelectedToolWithInputs,
  SelectedToolWithValidatedInputs,
  SelectedToolWithValidatedParameters,
  SelectedToolWithValidatedResources,
  ValidatedTool,
} from "../views/sessions/session/tools/ToolSelection";

// select tool outside of tool list, e.g. from search or SelectedFilesComponent
export const SET_SELECTED_TOOL_BY_ID = "SET_SELECTED_TOOL_BY_ID";
export const CLEAR_SELECTED_TOOL_BY_ID = "CLEAR_SELECTED_TOOL_BY_ID";

export function selectedToolById(state: SelectedToolById = null, { type, payload }) {
  switch (type) {
    case SET_SELECTED_TOOL_BY_ID:
      return { ...payload };
    case CLEAR_SELECTED_TOOL_BY_ID:
      return null;
    default:
      return state;
  }
}

// tool
export const SET_SELECTED_TOOL = "SET_SELECTED_TOOL";
export const CLEAR_SELECTED_TOOL = "CLEAR_SELECTED_TOOL";

export function selectedTool(state: SelectedTool = null, { type, payload }) {
  switch (type) {
    case SET_SELECTED_TOOL:
      return { ...payload };
    case CLEAR_SELECTED_TOOL:
      return null;
    default:
      return state;
  }
}

// tool with bindings
export const SET_SELECTED_TOOL_WITH_INPUTS = "SET_SELECTED_TOOL_WITH_BINDINGS";
export const CLEAR_SELECTED_TOOL_WITH_INPUTS = "CLEAR_SELECTED_TOOL_WITH_BINDINGS";

export function selectedToolWithInputs(state: SelectedToolWithInputs = null, { type, payload }) {
  switch (type) {
    case SET_SELECTED_TOOL_WITH_INPUTS:
      return { ...payload };
    case CLEAR_SELECTED_TOOL_WITH_INPUTS:
      return null;
    default:
      return state;
  }
}

// tool with validated inputs
export const SET_SELECTED_TOOL_WITH_VALIDATED_INPUTS = "SET_SELECTED_TOOL_WITH_VALIDATED_INPUTS";
export const CLEAR_SELECTED_TOOL_WITH_VALIDATED_INPUTS = "CLEAR_SELECTED_TOOL_WITH_VALIDATED_INPUTS";

export function selectedToolWithValidatedInputs(state: SelectedToolWithValidatedInputs = null, { type, payload }) {
  switch (type) {
    case SET_SELECTED_TOOL_WITH_VALIDATED_INPUTS:
      return { ...payload };
    case CLEAR_SELECTED_TOOL_WITH_VALIDATED_INPUTS:
      return null;
    default:
      return state;
  }
}

// tool with validated inputs and populated params
export const SET_SELECTED_TOOL_WITH_POPULATED_PARAMS = "SET_SELECTED_TOOL_WITH_POPULATED_PARAMS";
export const CLEAR_SELECTED_TOOL_WITH_POPULATED_PARAMS = "CLEAR_SELECTED_TOOL_WITH_POPULATED_PARAMS";

export function selectedToolWithPopulatedParams(state: SelectedToolWithValidatedInputs = null, { type, payload }) {
  switch (type) {
    case SET_SELECTED_TOOL_WITH_POPULATED_PARAMS:
      return { ...payload };
    case CLEAR_SELECTED_TOOL_WITH_POPULATED_PARAMS:
      return null;
    default:
      return state;
  }
}

// tool with validated inputs and populated params and validated params
export const SET_SELECTED_TOOL_WITH_VALIDATED_PARAMS = "SET_SELECTED_TOOL_WITH_VALIDATED_PARAMS";
export const CLEAR_SELECTED_TOOL_WITH_VALIDATED_PARAMS = "CLEAR_SELECTED_TOOL_WITH_VALIDATED_PARAMS";

export function selectedToolWithValidatedParams(state: SelectedToolWithValidatedParameters = null, { type, payload }) {
  switch (type) {
    case SET_SELECTED_TOOL_WITH_VALIDATED_PARAMS:
      return { ...payload };
    case CLEAR_SELECTED_TOOL_WITH_VALIDATED_PARAMS:
      return null;
    default:
      return state;
  }
}

// tool with validated inputs and populated params and validated params and validated resources
export const SET_SELECTED_TOOL_WITH_VALIDATED_RESOURCES = "SET_SELECTED_TOOL_WITH_VALIDATED_RESOURCES";
export const CLEAR_SELECTED_TOOL_WITH_VALIDATED_RESOURCES = "CLEAR_SELECTED_TOOL_WITH_VALIDATED_RESOURCES";

export function selectedToolWithValidatedResources(
  state: SelectedToolWithValidatedResources = null,
  { type, payload },
) {
  switch (type) {
    case SET_SELECTED_TOOL_WITH_VALIDATED_RESOURCES:
      return { ...payload };
    case CLEAR_SELECTED_TOOL_WITH_VALIDATED_RESOURCES:
      return null;
    default:
      return state;
  }
}

// validated tool
export const SET_VALIDATED_TOOL = "SET_VALIDATED_TOOL";
export const CLEAR_VALIDATED_TOOL = "CLEAR_VALIDATED_TOOL";

export function validatedTool(state: ValidatedTool = null, { type, payload }) {
  switch (type) {
    case SET_VALIDATED_TOOL:
      return { ...payload };
    case CLEAR_VALIDATED_TOOL:
      return null;
    default:
      return state;
  }
}
