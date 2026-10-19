import { Component, Input, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { DropdownCloseDirective } from "../../../../../shared/directives/dropdown-close.directive";
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownButtonItem,
  NgbDropdownItem,
} from "@ng-bootstrap/ng-bootstrap/dropdown";

@Component({
  templateUrl: "./dropdown-modal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    DropdownCloseDirective,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
  ],
})
export class DropdownModalComponent implements OnInit {
  @Input()
  buttonText: string;
  @Input()
  description: string;
  @Input()
  options: Map<any, string>;
  @Input()
  title: string;
  @Input()
  placeHolder: string;

  optionKeys = [];
  value: any;

  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit() {
    this.optionKeys = Array.from(this.options.keys());
  }

  getOptionName(key) {
    const name = this.options.get(key);

    if (name == null) {
      return this.placeHolder;
    }
    return name;
  }

  select(option) {
    this.value = option;
  }

  save() {
    this.activeModal.close(this.value);
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
