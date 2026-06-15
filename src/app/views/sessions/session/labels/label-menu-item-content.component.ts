import { Component, Input } from "@angular/core";
import { LabelMenuItem } from "./labels-context-menu.service";

// Renders the three pieces of a label menu item (checkbox / color dot / name)
// using Angular bindings. [innerHTML] is avoided here because the parent
// usually feeds these items from a getter that rebuilds them on every change
// detection cycle; with [innerHTML] Angular would tear down and recreate the
// button's children on every CD pass, which can leave a mousedown target
// detached before mouseup arrives and the browser then never fires a click.
@Component({
  selector: "ch-label-menu-item-content",
  template: `
    <span
      class="d-inline-block align-middle text-center fw-bold"
      style="width:13px;height:13px;border-radius:2px;box-sizing:border-box;margin-right:0.75em;line-height:11px;font-size:10px"
      [style.border]="checkboxBorder"
      [style.background]="checkboxBackground"
      [style.color]="checkboxColor"
      [style.position]="item.state === 'indeterminate' ? 'relative' : null">
      <ng-container *ngIf="item.state === 'checked'">✓</ng-container>
      <span
        *ngIf="item.state === 'indeterminate'"
        class="d-block"
        style="position:absolute;top:50%;left:50%;width:7px;height:2px;margin-top:-1px;margin-left:-3.5px;background:#fff"></span>
    </span>
    <span
      class="d-inline-block align-middle"
      style="width:0.6em;height:0.6em;border-radius:50%;margin-right:0.25em"
      [style.background]="item.colorBg"></span>
    <span>{{ item.label.name }}</span>
  `,
})
export class LabelMenuItemContentComponent {
  @Input() item!: LabelMenuItem;

  get checkboxBorder(): string {
    return this.item.state === "unchecked" ? "1px solid #adb5bd" : "1px solid #0d6efd";
  }

  get checkboxBackground(): string {
    return this.item.state === "unchecked" ? "#fff" : "#0d6efd";
  }

  get checkboxColor(): string | null {
    return this.item.state === "checked" ? "#fff" : null;
  }
}
