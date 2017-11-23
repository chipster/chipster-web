import { Component, Input } from '@angular/core';
import Tool from "../../../../../model/session/tool";
import {ToolService} from "../tool.service";
import {ToolSelectionService} from "../../tool.selection.service";


@Component({
  selector: 'ch-tool-parameters',
  templateUrl: './tool-parameters.html',
  styleUrls: ['./toos-parameters.less']
})

export class ToolParametersComponent {

  @Input() tool: Tool;

  // noinspection JSUnusedLocalSymbols
  constructor(private toolService: ToolService,
              private toolSelectionService: ToolSelectionService) {
  }
}
