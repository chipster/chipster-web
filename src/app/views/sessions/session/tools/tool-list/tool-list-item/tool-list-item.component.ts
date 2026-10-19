import { Component, Input, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "ch-tool-list-item",
  templateUrl: "tool-list-item.component.html",
  styleUrls: ["./tool-list-item.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ToolListItemComponent {
  @Input() color: string;
  @Input() categoryname: string;

  constructor() {}
}
