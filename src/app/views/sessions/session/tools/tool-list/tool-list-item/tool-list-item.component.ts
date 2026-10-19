import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { NgStyle } from "@angular/common";

@Component({
  selector: "ch-tool-list-item",
  templateUrl: "tool-list-item.component.html",
  styleUrls: ["./tool-list-item.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NgStyle],
})
export class ToolListItemComponent {
  @Input() color: string;
  @Input() categoryname: string;

  constructor() {}
}
