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

  constructor(public settingsService: SettingsService) {}

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

  toggleCompactToolList() {
    this.settingsService.compactToolList$.next(
      !this.settingsService.compactToolList$.getValue()
    );
  }
}