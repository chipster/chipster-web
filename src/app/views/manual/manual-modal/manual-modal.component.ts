import { Component, ChangeDetectionStrategy, inject, signal } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Tool } from "chipster-js-common";
import { ToolService } from "../../sessions/session/tools/tool.service";
import {
  NgbNav,
  NgbNavItem,
  NgbNavLink,
  NgbNavLinkBase,
  NgbNavContent,
  NgbNavOutlet,
} from "@ng-bootstrap/ng-bootstrap/nav";
import { ManualComponent } from "../manual.component";
import { ToolSourceComponent } from "../../../shared/components/tool-source/tool-source.component";
import { AsyncPipe } from "@angular/common";

@Component({
  selector: "ch-manual-modal-component",
  templateUrl: "./manual-modal.component.html",
  styleUrls: ["./manual-modal.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavLinkBase,
    NgbNavContent,
    ManualComponent,
    ToolSourceComponent,
    NgbNavOutlet,
    AsyncPipe,
  ],
})
export class ManualModalComponent {
  activeModal = inject(NgbActiveModal);
  toolService = inject(ToolService);

  // set through the modal ref by the code that opens the modal
  readonly tool = signal<Tool>(undefined);
}
