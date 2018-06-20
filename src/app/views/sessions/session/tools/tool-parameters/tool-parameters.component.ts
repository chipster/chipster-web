import { Component, Input } from "@angular/core";
import Tool from "../../../../../model/session/tool";
import { ToolService } from "../tool.service";
import { ToolSelectionService } from "../../tool.selection.service";

@Component({
  selector: "ch-tool-parameters",
  templateUrl: "./tool-parameters.component.html",
  styleUrls: ["./toos-parameters.component.less"]
})
export class ToolParametersComponent {
  @Input() tool: Tool;

  // noinspection JSUnusedLocalSymbols
  constructor(
    public toolService: ToolService,
    public toolSelectionService: ToolSelectionService
  ) {}
}
