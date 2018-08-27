import { Tool, InputBinding, Category, Module } from "chipster-js-common";

export interface ToolSelection {
  tool: Tool;
  inputBindings: Array<InputBinding>;
  category: Category;
  module: Module;
}
