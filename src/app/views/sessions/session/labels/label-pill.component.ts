import { Component, input } from "@angular/core";
import { Label } from "chipster-js-common";
import { resolveLabelColor, textColorForBackground } from "./label-palette";

@Component({
  selector: "ch-label-pill",
  templateUrl: "./label-pill.component.html",
  styleUrls: ["./label-pill.component.less"],
})
export class LabelPillComponent {
  readonly label = input<Label>(undefined);

  get background(): string {
    return resolveLabelColor(this.label()?.color);
  }

  get text(): string {
    return textColorForBackground(this.background);
  }
}
