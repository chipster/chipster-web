import {
  Component, OnInit, Input, Output,
  EventEmitter
} from '@angular/core';
import Tool from "../../../../../../model/session/tool";
import {ToolService} from "../../tool.service";

@Component({
  selector: 'ch-tools-parameter-form',
  templateUrl: './tools-parameter-form.component.html',
  styleUrls: ['./tools-parameter-form.component.less']
})
export class ToolsParameterFormComponent implements OnInit {

  @Input() tool: Tool;
  @Output() description: EventEmitter<string> = new EventEmitter();

  constructor(private toolService: ToolService) { }

  ngOnInit() {}

  setDescription(description: string): void {
    this.description.emit(description);
  }

}
