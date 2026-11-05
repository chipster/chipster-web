import { describe, expect, it } from "vitest";
import {
  SET_SELECTED_TOOL,
  SET_SELECTED_TOOL_WITH_INPUTS,
  SET_SELECTED_TOOL_WITH_POPULATED_PARAMS,
  SET_SELECTED_TOOL_WITH_VALIDATED_INPUTS,
  SET_SELECTED_TOOL_WITH_VALIDATED_PARAMS,
  SET_SELECTED_TOOL_WITH_VALIDATED_RESOURCES,
  SET_VALIDATED_TOOL,
  selectedTool,
  selectedToolWithInputs,
  selectedToolWithPopulatedParams,
  selectedToolWithValidatedInputs,
  selectedToolWithValidatedParams,
  selectedToolWithValidatedResources,
  validatedTool,
} from "./tool.reducer";

/*
 * The stages of the tool validation chain of the tools component. A selection clears every later
 * stage, so that nothing shows or revalidates the earlier selection, also when it's the same tool.
 */

const stages = [
  { reducer: selectedToolWithInputs, set: SET_SELECTED_TOOL_WITH_INPUTS },
  { reducer: selectedToolWithValidatedInputs, set: SET_SELECTED_TOOL_WITH_VALIDATED_INPUTS },
  { reducer: selectedToolWithPopulatedParams, set: SET_SELECTED_TOOL_WITH_POPULATED_PARAMS },
  { reducer: selectedToolWithValidatedParams, set: SET_SELECTED_TOOL_WITH_VALIDATED_PARAMS },
  { reducer: selectedToolWithValidatedResources, set: SET_SELECTED_TOOL_WITH_VALIDATED_RESOURCES },
  { reducer: validatedTool, set: SET_VALIDATED_TOOL },
];

const tool = { tool: { name: { id: "a.R" } } } as never;
const selection = { type: SET_SELECTED_TOOL, payload: tool };

describe("the tool reducers", () => {
  it("set the selected tool", () => {
    expect(selectedTool(null, selection)).toEqual(tool);
  });

  for (const stage of stages) {
    it(`clear ${stage.reducer.name} when a tool is selected`, () => {
      const state = stage.reducer(null, { type: stage.set, payload: tool });
      expect(state).toEqual(tool);
      expect(stage.reducer(state, selection)).toBeNull();
      expect(stage.reducer(state, { type: "OTHER", payload: null })).toBe(state);
    });
  }
});
