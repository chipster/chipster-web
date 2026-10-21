import { Component, OnInit, Input, ChangeDetectionStrategy, inject } from "@angular/core";
import { Tool } from "chipster-js-common";
import { ToolResource } from "../../resources/tool-resource";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";

@Component({
  selector: "ch-tool-source",
  template: '<pre class="tool-source">{{source}}</pre>',
  styleUrls: ["./tool-source.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ToolSourceComponent implements OnInit {
  private toolResource = inject(ToolResource);
  private restErrorService = inject(RestErrorService);

  source: string;
  @Input()
  selectedTool: Tool;

  ngOnInit() {
    this.toolResource.getSourceCode(this.selectedTool.name.id).subscribe({
      next: (sourceCode) => {
        this.source = sourceCode;
      },
      error: (err) => this.restErrorService.showError("get source code failed", err),
    });
  }
}
