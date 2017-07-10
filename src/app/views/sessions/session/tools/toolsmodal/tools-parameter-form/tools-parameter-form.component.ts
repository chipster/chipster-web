import {
  Component, Input
} from '@angular/core';
import Tool from "../../../../../../model/session/tool";
import {ToolService} from "../../tool.service";
import {ToolSelectionService} from "../../../tool.selection.service";


@Component({
  selector: 'ch-tools-parameter-form',
  templateUrl: './tools-parameter-form.component.html',
  styleUrls: ['./tools-parameter-form.component.less']
})

export class ToolsParameterFormComponent {

  @Input() tool: Tool;

  constructor(private toolService: ToolService,
              private toolSelectionService: ToolSelectionService) { }

}
