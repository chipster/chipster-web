import { Component, HostListener } from "@angular/core";
import { HotkeyService } from "./shared/services/hotkey.service";

@Component({
  selector: "ch-app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  constructor(private readonly hotkeyService: HotkeyService) {}

  @HostListener("document:keydown", ["$event"])
  onKeydown(event: KeyboardEvent) {
    this.hotkeyService.handleKeydown(event);
  }
}
