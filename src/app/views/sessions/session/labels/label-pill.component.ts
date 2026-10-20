import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { Label } from "chipster-js-common";
import { resolveLabelColor, textColorForBackground } from "./label-palette";

@Component({
  selector: "ch-label-pill",
  templateUrl: "./label-pill.component.html",
  styleUrls: ["./label-pill.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class LabelPillComponent {
  @Input() label: Label;

  get background(): string {
    return resolveLabelColor(this.label?.color);
  }

  get text(): string {
    return textColorForBackground(this.background);
  }
}
