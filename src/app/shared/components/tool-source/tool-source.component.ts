import { Component, OnInit, Input } from "@angular/core";
import { Tool } from "chipster-js-common";
import { ToolResource } from "../../resources/tool-resource";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";

@Component({
  selector: "ch-tool-source",
  template: '<pre class="tool-source">{{source}}</pre>',
  styleUrls: ["./tool-source.component.less"]
})
export class ToolSourceComponent implements OnInit {
  source: string;
  @Input()
  selectedTool: Tool;

  constructor(
    private toolResource: ToolResource,
    private restErrorService: RestErrorService,
  ) { }

  ngOnInit() {
    this.toolResource
      .getSourceCode(this.selectedTool.name.id)
      .subscribe(sourceCode => {
        this.source = sourceCode;
      }, err => this.restErrorService.showError("get source code failed", err));
  }
}
