import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { NGB_DROPDOWN_IMPORTS } from "../../../../../shared/directives/dropdown-close.directive";

@Component({
  templateUrl: "./dropdown-modal.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NGB_DROPDOWN_IMPORTS],
})
export class DropdownModalComponent implements OnInit {
  private activeModal = inject(NgbActiveModal);

  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  buttonText: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  description: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  options: Map<any, string>;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  title: string;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input()
  placeHolder: string;

  optionKeys = [];
  value: any;

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
