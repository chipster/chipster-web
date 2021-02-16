import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from "@angular/core";
import log from "loglevel";
import { ColumnItem } from "./wrangle-modal.component";

@Component({
  selector: "ch-multi-dropdown",
  templateUrl: "./multi-dropdown.component.html",
  styleUrls: ["./multi-dropdown.component.less"]
})
/**
 * Two things make things a little bit complicated here:
 *
 * 1) If multiple = false selectedIndexes is not an array but a single value
 *
 * 2) In the form, column index is used as bindValue to deal with non-unique column names.
 *
 * Inputs and outputs should always be ColumnItem[] though
 */
export class MultiDropdownComponent implements OnInit, OnChanges {
  @Input() items: ColumnItem[];
  @Input() multiple?: boolean = true;

  @Output() private selectionChanged = new EventEmitter<ColumnItem[]>();

  @ViewChild("dropdown") dropdown;

  private readonly selectAllString = "Select all";
  private readonly selectAllFilteredString = "Select all filtered";

  public placeholder: string;
  selectedIndexes: number[] = []; // when multiple = false form ngModel makes this a single value(not an array)
  filteredIndexes: number[] = [];
  indexToColumnItemMap = new Map<number, ColumnItem>();

  selectAllButtonText = this.selectAllString;

  ngOnInit(): void {
    this.placeholder = this.multiple ? "Select columns" : "Select column";
  }

  ngOnChanges(): void {
    this.indexToColumnItemMap.clear();
    this.items.forEach(item => this.indexToColumnItemMap.set(item.index, item));

    // make sure currently selected are included in the options, if not, unselect
    // shouldn't happen, but just in case
    // see selectedItem declaration
    const selectedIndexesAsArray = []
      .concat(this.selectedIndexes)
      .filter(index => index != null);
    const includedIndexes = selectedIndexesAsArray.filter(index =>
      this.items.includes(this.indexToColumnItemMap.get(index))
    );
    if (selectedIndexesAsArray.length !== includedIndexes.length) {
      log.warn(
        "selected column not included in options after options change",
        selectedIndexesAsArray,
        includedIndexes
      );
      this.selectedIndexes = includedIndexes;
      this.emit(this.selectedIndexes);
    }
  }

  onSearch(event): void {
    if (!this.multiple) {
      return;
    }
    this.filteredIndexes = event.items.map(item => item.index);
    this.selectAllButtonText =
      event.term.length > 0
        ? this.selectAllFilteredString
        : this.selectAllString;
  }

  onKeyDownEnter(event): void {
    if (!this.multiple) {
      return;
    }
    event.stopImmediatePropagation();
    this.addFilteredToSelectedIndexes();
    this.dropdown.close();
  }

  onSelectionChange(): void {
    // selectedIndexes may be array, value or null, always emit array without null
    // see selectedIndexes declaration
    this.emit([].concat(this.selectedIndexes).filter(index => index != null));
  }

  onOpen(): void {
    if (!this.multiple) {
      return;
    }
    this.selectAllButtonText = this.selectAllString;
    this.filteredIndexes = this.items.map(item => item.index);
  }

  onSelectAll(): void {
    if (!this.multiple) {
      return;
    }
    this.addFilteredToSelectedIndexes();
    this.dropdown.close();
  }

  onDone(): void {
    this.dropdown.close();
  }

  private emit(selected: number[]): void {
    this.selectionChanged.emit(
      selected.map(index => this.indexToColumnItemMap.get(index))
    );
  }

  private addFilteredToSelectedIndexes(): void {
    this.selectedIndexes = this.selectedIndexes.concat(
      this.filteredIndexes.filter(
        index => !this.selectedIndexes.includes(index)
      )
    );
    this.emit(this.selectedIndexes);
  }
}
