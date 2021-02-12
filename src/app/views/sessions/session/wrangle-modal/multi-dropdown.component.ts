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
 * Note that if multiple = false selectedItem is not an array but a single ColumnItem
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
  selectedItems: ColumnItem[] = []; // when multiple = false form ngModel makes this ColumnItem (not an array)
  filteredItems: ColumnItem[] = [];

  selectAllButtonText = this.selectAllString;

  ngOnInit(): void {
    this.placeholder = this.multiple ? "Select columns" : "Select column";
  }

  ngOnChanges(): void {
    // make sure currently selected are included in the options, if not, unselect
    // shouldn't happen, but just in case

    // seel selectedItem declaration
    const selectedItemsAsArray = []
      .concat(this.selectedItems)
      .filter(item => item != null);
    const includedItems = selectedItemsAsArray.filter(item =>
      this.items.includes(item)
    );
    if (selectedItemsAsArray.length !== includedItems.length) {
      log.warn(
        "selected column not included in options after options change",
        selectedItemsAsArray,
        includedItems
      );
      this.selectedItems = includedItems;
      this.selectionChanged.emit(this.selectedItems);
    }
  }

  onSearch(event): void {
    if (!this.multiple) {
      return;
    }
    this.filteredItems = event.items;
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
    this.addFilteredToSelectedItems();
    this.dropdown.close();
  }

  onSelectionChange(): void {
    // selectedItem may be array, value or null, always emit array without null
    // see selectedItems declaration
    this.selectionChanged.emit(
      [].concat(this.selectedItems).filter(item => item != null)
    );
  }

  onOpen(): void {
    if (!this.multiple) {
      return;
    }
    this.selectAllButtonText = this.selectAllString;
    this.filteredItems = this.items;
  }

  onSelectAll(): void {
    if (!this.multiple) {
      return;
    }
    this.addFilteredToSelectedItems();
    this.dropdown.close();
  }

  onDone(): void {
    this.dropdown.close();
  }

  private addFilteredToSelectedItems(): void {
    this.selectedItems = this.selectedItems.concat(
      this.filteredItems.filter(
        sampleItem => !this.selectedItems.includes(sampleItem)
      )
    );
    this.selectionChanged.emit(this.selectedItems);
  }
}
