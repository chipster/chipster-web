import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject, input, output, viewChild } from "@angular/core";
import { HotkeyService } from "../../services/hotkey.service";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "ch-search-box",
  templateUrl: "./search-box.component.html",
  styleUrls: ["./search-box.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule],
})
export class SearchBoxComponent implements OnInit, OnDestroy {
  private readonly hotkeyService = inject(HotkeyService);

  readonly placeholder = input<string>(undefined);
  readonly focusOnInit = input(false);
  readonly focusHotkey = input<string>(undefined);
  readonly focusHotkeyDescription = input<string>(undefined);

  readonly valueChange = output<string>();
  readonly enterKey = output<void>();

  readonly searchInput = viewChild("searchInput");

  searchTerm: string;

  private unregisterHotkey: (() => void) | null = null;

  ngOnInit() {
    const focusHotkey = this.focusHotkey();
    if (focusHotkey) {
      this.unregisterHotkey = this.hotkeyService.register(focusHotkey, this.focusHotkeyDescription(), () =>
        this.focus(),
      );
    }
  }

  ngOnDestroy() {
    this.unregisterHotkey?.();
  }

  focus() {
    // why this doesn't work without setTimeout()?
    setTimeout(() => {
      this.searchInput().nativeElement.focus();
    }, 0);
  }

  clearClick(e: any) {
    // if this component is in a dropdown, this button shouldn't close it
    e.stopPropagation();
    this.clear();
  }

  clear() {
    this.searchTerm = null;
    this.valueChange.emit(this.searchTerm);
  }

  searchKeyEvent(e: any) {
    if (e.keyCode === 13) {
      // enter
      // the search can be cleared (at least in the workflow view)
      this.searchTerm = null;
      this.enterKey.emit();
    }

    if (e.keyCode === 27) {
      // escape key
      // don't close the dropdown if there is something to clear
      if (this.searchTerm) {
        e.stopPropagation();
      }
      this.clear();
    } else {
      this.valueChange.emit(this.searchTerm);
    }
  }
}
