import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { HotkeyService } from "../../services/hotkey.service";

@Component({
  selector: "ch-hotkey-cheatsheet",
  templateUrl: "./hotkey-cheatsheet.component.html",
  styleUrls: ["./hotkey-cheatsheet.component.less"],
  encapsulation: ViewEncapsulation.None,
})
export class HotkeyCheatsheetComponent implements OnInit, OnDestroy {
  @ViewChild("content") contentTemplate!: TemplateRef<unknown>;

  private unregister!: () => void;
  private modalRef: NgbModalRef | null = null;

  constructor(
    private readonly hotkeyService: HotkeyService,
    private readonly modalService: NgbModal,
  ) {}

  ngOnInit() {
    this.unregister = this.hotkeyService.register("?", "Show keyboard shortcuts", () => {
      if (this.hotkeyService.getShortcuts().length > 0) {
        this.toggle();
      }
    });
  }

  ngOnDestroy() {
    this.unregister();
    this.modalRef?.close();
  }

  get shortcuts() {
    return this.hotkeyService.getShortcuts().sort((a, b) => {
      if (a.key === "?") return 1;
      if (b.key === "?") return -1;
      return 0;
    });
  }

  close() {
    this.modalRef?.close();
  }

  toggle() {
    if (this.modalRef) {
      this.modalRef.close();
    } else {
      this.modalRef = this.modalService.open(this.contentTemplate, { windowClass: "ch-hotkey-cheatsheet" });
      this.modalRef.hidden.subscribe(() => {
        this.modalRef = null;
      });
    }
  }
}
