import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from "@angular/core";
import { Hotkey, HotkeysService } from "angular2-hotkeys";

@Component({
  selector: "ch-search-box",
  templateUrl: "./search-box.component.html",
  styleUrls: ["./search-box.component.less"]
})
export class SearchBoxComponent implements OnInit, OnDestroy {
  @Input()
  placeholder: string;
  @Input()
  focusOnInit = false;
  @Input()
  focusHotkey: string;
  @Input()
  focusHotkeyDescription: string;

  @Output()
  valueChange = new EventEmitter<string>();
  @Output()
  enterKey = new EventEmitter<void>();

  @ViewChild("searchInput", { static: false }) searchInput;

  searchTerm: string;

  private hotkey: Hotkey | Hotkey[];

  constructor(private hotkeysService: HotkeysService) {}

  ngOnInit() {
    // add focus hotkey
    this.hotkey = this.hotkeysService.add(
      new Hotkey(
        this.focusHotkey,
        (event: KeyboardEvent): boolean => {
          this.focus();
          return false; // Prevent bubbling
        },
        undefined,
        this.focusHotkeyDescription
      )
    );
  }

  ngOnDestroy() {
    this.hotkeysService.remove(this.hotkey);
  }

  focus() {
    // why this doesn't work without setTimeout()?
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
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
