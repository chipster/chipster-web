import {Component, OnInit, Input} from '@angular/core';
import {ToolResource} from "../../../../../../shared/resources/toolresource";
import Tool from "../../../../../../model/session/tool";

@Component({
  selector: 'ch-tool-source',
  template: '<pre>{{source}}</pre>',
})
export class ToolSourceComponent implements OnInit {

  private source: string;
  @Input() selectedTool: Tool;

  constructor(private toolResource: ToolResource) { }

  ngOnInit() {
    this.toolResource.getSourceCode(this.selectedTool.name.id).subscribe((sourceCode) => {
      this.source = sourceCode;
    });
  }

}
