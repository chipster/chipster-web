import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";

@Component({
  selector: 'ch-search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.less'],
})
export class SearchBoxComponent {

  @Input() placeholder: string;
  @Input() focusOnInit = false;
  @Output() onValueChange = new EventEmitter<string>();
  @Output() onEnterKey = new EventEmitter<void>();

  @ViewChild('searchInput') searchInput;

  searchTerm: string;

  focus() {
    // why this doesn't work without setTimeout()?
    setTimeout(() => {
        this.searchInput.nativeElement.focus();
    }, 0);
  }

  clear() {
    this.searchTerm = null;
    this.onValueChange.emit(this.searchTerm);
  }

  searchKeyEvent(e: any) {

    if (e.keyCode == 13) { // enter
      this.onEnterKey.emit();
    }

    if (e.keyCode == 27) { // escape key
      // don't close the dropdown if there is something to clear
      if (this.searchTerm) {
        e.stopPropagation();
      }
      this.clear();
    } else {

      this.onValueChange.emit(this.searchTerm);
    }
  }
}