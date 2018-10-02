import { Component, Input, Output, EventEmitter } from "@angular/core";
import { Tool } from "chipster-js-common";
import { ToolService } from "../tool.service";
import { ToolSelectionService } from "../../tool.selection.service";
import { NgbDropdown } from "@ng-bootstrap/ng-bootstrap";


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
    public toolSelectionService: ToolSelectionService,
    private dropDown: NgbDropdown
  ) {}

  closeDropDownDialog() {
    this.dropDown.close();
  }
}
