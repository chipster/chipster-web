import {ToolSelection} from "../views/sessions/session/tools/ToolSelection";

export const CLEAR_TOOL_SELECTION = 'CLEAR_TOOL_SELECTION';
export const SET_TOOL_SELECTION = 'SET_TOOL_SELECTION';

export const toolSelection = (state: ToolSelection = null, {type, payload}) => {

  switch(type) {
    case CLEAR_TOOL_SELECTION:
      return null;
    case SET_TOOL_SELECTION:
      return Object.assign({}, payload);
    default:
      return state;
  }

};
