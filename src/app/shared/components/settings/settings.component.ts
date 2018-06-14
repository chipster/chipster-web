import { Component, OnInit, OnDestroy } from "@angular/core";
import { SettingsService } from "../../services/settings.service";
import { Subject } from "rxjs/Subject";

@Component({
  selector: "ch-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.less"]
})
export class SettingsComponent implements OnInit, OnDestroy {
  public showToolsPanel: boolean;

  private unsubscribe: Subject<any> = new Subject();

  constructor(private settingsService: SettingsService) {}

  ngOnInit() {
    this.settingsService.showToolsPanel$
      .takeUntil(this.unsubscribe)
      .subscribe((showTools: boolean) => {
        this.showToolsPanel = showTools;
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  toggleShowToolsPanel() {
    this.settingsService.showToolsPanel$.next(
      !this.settingsService.showToolsPanel$.getValue()
    );
  }

  toggleSplitSelectionPanel() {
    this.settingsService.splitSelectionPanel$.next(
      !this.settingsService.splitSelectionPanel$.getValue()
    );
  }
  toggleAlwaysShowTools() {
    this.settingsService.alwaysShowTools$.next(
      !this.settingsService.alwaysShowTools$.getValue()
    );
  }
}
