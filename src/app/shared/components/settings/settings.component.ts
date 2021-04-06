import { Component, OnDestroy } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import {
  SessionListMode,
  SettingsService,
} from "../../services/settings.service";

@Component({
  selector: "ch-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.less"],
})
export class SettingsComponent implements OnDestroy {
  public SessionListMode = SessionListMode; // ref for using enum in template
  private unsubscribe: Subject<any> = new Subject();

  constructor(
    public settingsService: SettingsService,
    public activeModal: NgbActiveModal
  ) {}

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

  setSessionListMode(mode: SessionListMode) {
    this.settingsService.sessionListMode$.next(mode);
  }

  showDataselectionTooltip() {
    this.settingsService.showDatasetSelectionTooltip$.next(
      !this.settingsService.showDatasetSelectionTooltip$.getValue()
    );
  }
}
