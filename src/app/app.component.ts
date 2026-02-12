import { Component } from "@angular/core";
import { NavigationComponent } from "./views/navigation/navigation.component";
import { ErrorComponent } from "./views/error/error.component";
import { RouterOutlet } from "@angular/router";
import { HotkeysCheatsheetComponent } from "angular2-hotkeys";

@Component({
  selector: "ch-app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  imports: [NavigationComponent, ErrorComponent, RouterOutlet],
})
export class AppComponent {}
