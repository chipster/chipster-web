import { Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./dropdown-modal.component.html",
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
