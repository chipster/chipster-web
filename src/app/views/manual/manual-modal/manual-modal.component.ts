import { Component, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Tool } from "chipster-js-common";
import { ToolService } from "../../sessions/session/tools/tool.service";

@Component({
  selector: "ch-manual-modal-component",
  templateUrl: "./manual-modal.component.html",
  styleUrls: ["./manual-modal.component.less"]
})
export class ManualModalComponent {
  @Input() tool: Tool;

  constructor(
    public activeModal: NgbActiveModal,
    public toolService: ToolService
  ) {}
}
