import { Component, Input } from "@angular/core";
import { NgbActiveModal, NgbNav, NgbNavOutlet } from "@ng-bootstrap/ng-bootstrap";
import { Tool } from "chipster-js-common";
import { ToolService } from "../../sessions/session/tools/tool.service";
import { ManualComponent } from "../manual.component";
import { AsyncPipe } from "@angular/common";
import { ToolSourceComponent } from "../../../shared/components/tool-source/tool-source.component";

@Component({
  selector: "ch-manual-modal-component",
  templateUrl: "./manual-modal.component.html",
  styleUrls: ["./manual-modal.component.less"],
  imports: [ManualComponent, AsyncPipe, ToolSourceComponent, NgbNavOutlet, NgbNav],
})
export class ManualModalComponent {
  @Input() tool: Tool;

  constructor(
    public activeModal: NgbActiveModal,
    public toolService: ToolService,
  ) {}
}
