import { Component, input } from "@angular/core";
import { NgStyle } from "@angular/common";

@Component({
  selector: "ch-tool-list-item",
  templateUrl: "tool-list-item.component.html",
  styleUrls: ["./tool-list-item.component.less"],
  imports: [NgStyle],
})
export class ToolListItemComponent {
  readonly color = input<string>(undefined);
  readonly categoryname = input<string>(undefined);

  constructor() {}
}
