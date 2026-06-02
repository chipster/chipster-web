import { Component, Input } from "@angular/core";
import { Label } from "chipster-js-common";
import { getLabelColor } from "./label-palette";

@Component({
  selector: "ch-label-pill",
  templateUrl: "./label-pill.component.html",
  styleUrls: ["./label-pill.component.less"],
})
export class LabelPillComponent {
  @Input() label: Label;

  get background(): string {
    return getLabelColor(this.label?.color).background;
  }

  get text(): string {
    return getLabelColor(this.label?.color).text;
  }
}
