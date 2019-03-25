import { Component, OnInit, OnDestroy } from "@angular/core";
import {
  SettingsService,
  SessionListMode
} from "../../services/settings.service";
import { Subject } from "rxjs/Subject";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "ch-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.less"]
})
export class SettingsComponent implements OnInit, OnDestroy {
  public SessionListMode = SessionListMode; // ref for using enum in template
  private unsubscribe: Subject<any> = new Subject();

  constructor(
    public settingsService: SettingsService,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit() { }

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
