import { Component, HostListener, ChangeDetectionStrategy, inject } from "@angular/core";
import { HotkeyService } from "./shared/services/hotkey.service";
import { NavigationComponent } from "./views/navigation/navigation.component";
import { HotkeyCheatsheetComponent } from "./shared/components/hotkey-cheatsheet/hotkey-cheatsheet.component";
import { ErrorComponent } from "./views/error/error.component";
import { ToastsComponent } from "./shared/components/toasts/toasts.component";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "ch-app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NavigationComponent, HotkeyCheatsheetComponent, ErrorComponent, ToastsComponent, RouterOutlet],
})
export class AppComponent {
  private readonly hotkeyService = inject(HotkeyService);

  @HostListener("document:keydown", ["$event"])
  onKeydown(event: KeyboardEvent) {
    this.hotkeyService.handleKeydown(event);
  }
}
