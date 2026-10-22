import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { NGB_DROPDOWN_IMPORTS } from "../../../../../shared/directives/dropdown-close.directive";

@Component({
  templateUrl: "./dropdown-modal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NGB_DROPDOWN_IMPORTS],
})
export class DropdownModalComponent implements OnInit {
  private activeModal = inject(NgbActiveModal);

  // set through the modal ref by the code that opens the modal
  buttonText = signal<string>(undefined);
  description = signal<string>(undefined);
  options = signal<Map<any, string>>(undefined);
  title = signal<string>(undefined);
  placeHolder = signal<string>(undefined);

  optionKeys = [];
  value: any;

  ngOnInit() {
    this.optionKeys = Array.from(this.options().keys());
  }

  getOptionName(key) {
    const name = this.options().get(key);

    if (name == null) {
      return this.placeHolder();
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
