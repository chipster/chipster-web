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

  private readonly unregister: Array<() => void> = [];
  private modalRef: NgbModalRef | null = null;

  constructor(
    private readonly hotkeyService: HotkeyService,
    private readonly modalService: NgbModal,
  ) {}

  ngOnInit() {
    const open = () => {
      if (this.hotkeyService.getShortcuts().length > 0) {
        this.toggle();
      }
    };
    this.unregister.push(
      this.hotkeyService.register("?", "Show keyboard shortcuts", open),
      this.hotkeyService.register("h", "Show keyboard shortcuts", open),
    );
  }

  ngOnDestroy() {
    this.unregister.forEach((fn) => fn());
    this.modalRef?.close();
  }

  get shortcuts(): Array<{ keys: string[]; description: string }> {
    // "h" and "?" both open this modal; show them as a single "H / ?" row last,
    // with each key in its own <kbd> and the "/" separator left unstyled.
    const helpKeys = new Set(["h", "?"]);
    const rows = this.hotkeyService
      .getShortcuts()
      .filter((s) => !helpKeys.has(s.key))
      .map((s) => ({ keys: [s.key], description: s.description }));
    rows.push({ keys: ["H", "?"], description: "Show keyboard shortcuts" });
    return rows;
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
