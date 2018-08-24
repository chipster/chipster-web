import { Component, OnInit, Input } from "@angular/core";
import { Tool } from "chipster-js-common";
import { ToolResource } from "../../resources/toolresource";

@Component({
  selector: "ch-tool-source",
  template: '<pre class="tool-source">{{source}}</pre>',
  styleUrls: ["./tool-source.component.less"]
})
export class ToolSourceComponent implements OnInit {
  source: string;
  @Input() selectedTool: Tool;

  constructor(private toolResource: ToolResource) {}

  ngOnInit() {
    this.toolResource
      .getSourceCode(this.selectedTool.name.id)
      .subscribe(sourceCode => {
        this.source = sourceCode;
      });
  }
}
