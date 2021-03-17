import { Component, Input } from "@angular/core";

@Component({
  selector: "ch-tool-list-item",
  templateUrl: "tool-list-item.component.html",
  styleUrls: ["./tool-list-item.component.less"],
})
export class ToolListItemComponent {
  @Input() color: string;
  @Input() categoryname: string;

  constructor() {}
}
