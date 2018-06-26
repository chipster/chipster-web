import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ToolService } from "../../sessions/session/tools/tool.service";
import Tool from "../../../model/session/tool";

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
