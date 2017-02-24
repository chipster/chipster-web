
import Tool from "../../../../model/session/tool";
import InputBinding from "../../../../model/session/inputbinding";
import Category from "../../../../model/session/category";
import Module from "../../../../model/session/module";

export interface ToolSelection {
  tool: Tool,
  inputBindings: Array<InputBinding>,
  category: Category,
  module: Module
}
