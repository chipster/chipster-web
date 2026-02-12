import { Component, ViewEncapsulation } from "@angular/core";
import { RouterModule, RouterOutlet } from "@angular/router";

@Component({
  selector: "ch-admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
  imports: [RouterOutlet, RouterModule],
})
export class AdminComponent {
  constructor() {}
}
