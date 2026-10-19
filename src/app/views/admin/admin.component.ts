import { Component, ViewEncapsulation, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

@Component({
  selector: "ch-admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
})
export class AdminComponent {
  constructor() {}
}
