import { Component, OnDestroy, inject } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { SessionListMode, SettingsService } from "../../services/settings.service";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "ch-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.less"],
  imports: [FormsModule],
})
export class SettingsComponent implements OnDestroy {
  settingsService = inject(SettingsService);
  activeModal = inject(NgbActiveModal);

  public SessionListMode = SessionListMode; // ref for using enum in template
  private unsubscribe: Subject<any> = new Subject();

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }

  toggleShowToolsPanel() {
    this.settingsService.showToolsPanel$.next(!this.settingsService.showToolsPanel$.getValue());
  }

  toggleSplitSelectionPanel() {
    this.settingsService.splitSelectionPanel$.next(!this.settingsService.splitSelectionPanel$.getValue());
  }

  toggleCompactToolList() {
    this.settingsService.compactToolList$.next(!this.settingsService.compactToolList$.getValue());
  }

  setSessionListMode(mode: SessionListMode) {
    this.settingsService.sessionListMode$.next(mode);
  }

  showDataselectionTooltip() {
    this.settingsService.showDatasetSelectionTooltip$.next(
      !this.settingsService.showDatasetSelectionTooltip$.getValue(),
    );
  }
}
