import { Component, ViewEncapsulation, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "ch-admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AdminComponent {
  constructor() {}
}
