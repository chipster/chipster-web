import Tool from "../../../../../model/session/tool";
import {ToolResource} from "../../../../../shared/resources/toolresource";
import {Component, Input} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'ch-sourcemodal',
  templateUrl: './sourcemodal.html',
})
export default class SourceModalComponent {

  @Input('module') private module: string;
  @Input('category') private category: string;
  @Input('selectedTool') private selectedTool: Tool;

  private source: string;

  constructor(private ngbModal: NgbModal,
              private toolResource: ToolResource) {
  }

  open(content) {
    this.ngbModal.open(content, {size: "lg"});

    this.toolResource.getSourceCode(this.selectedTool.name.id).subscribe((sourceCode) => {
      this.source = sourceCode;
    });
  }
}
