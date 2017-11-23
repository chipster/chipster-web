import {Component, OnInit, Input} from '@angular/core';
import {ToolResource} from "../../../../../shared/resources/toolresource";
import Tool from "../../../../../model/session/tool";

@Component({
  selector: 'ch-tool-source',
  template: '<div class="container"><pre class="tool-source">{{source}}</pre></div>',
  styleUrls: ['./tool-source.component.less']
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
