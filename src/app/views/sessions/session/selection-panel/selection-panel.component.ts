import { Dataset, Tool } from "chipster-js-common";
import { Component, computed, inject, input } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { SessionData } from "../../../../model/session/session-data";
import { SelectionService } from "../selection.service";
import { ToolSelectionService } from "../tool.selection.service";
import { SettingsService } from "../../../../shared/services/settings.service";
import { ToolDetailsComponent } from "../tools/tool-details/tool-details.component";
import { JobComponent } from "../selectiondetails/job/job.component";
import { FileComponent } from "../selectiondetails/selected-files/selected-files.component";

@Component({
  selector: "ch-selection-panel",
  templateUrl: "./selection-panel.component.html",
  styleUrls: ["./selection-panel.component.less"],
  imports: [ToolDetailsComponent, JobComponent, FileComponent],
})
export class SelectionPanelComponent {
  selectionService = inject(SelectionService);
  private toolSelectionService = inject(ToolSelectionService);
  settingsService = inject(SettingsService);

  readonly sessionData = input<SessionData>(undefined);
  readonly tools = input<Tool[]>(undefined);

  // FIXME after tool state refactoring
  // public toolSelection: ToolSelection;
  public selectedDatasets: Array<Dataset>;

  // a bit awkward to use enums in the template so going with these
  public showTool = false;
  public showFile = false;
  // the selection service reads the selection from a signal
  public readonly showJob = computed(() => this.selectionService.selectedJobs.length > 0);

  // the settings modal changes it
  readonly splitSelectionPanel = toSignal(this.settingsService.splitSelectionPanel$, { requireSync: true });

  // FIXME after tool selection refactoring
  // this.toolSelectionService.toolSelection$
  //   .takeUntil(this.unsubscribe)
  //   .subscribe(toolSelection => {
  //     this.toolSelection = toolSelection;
  //     if (toolSelection) {
  //       this.showTool = true;
  //       this.showFile = false;
  //       this.showJob = false;
  //     }
  //   }, err => this.errorService.showError("tool selection failed", err));

  // this.selectionService.selectedDatasets$
  //   .takeUntil(this.unsubscribe)
  //   .subscribe(
  //     (selectedDatasets: Array<Dataset>) => {
  //       this.selectedDatasets = selectedDatasets;
  //       if (this.selectedDatasets.length > 0) {
  //         this.showFile = true;
  //         this.showTool = false;
  //         this.showJob = false;
  //       } else {
  //         this.showFile = false;
  //         if (this.toolSelection) {
  //           this.showTool = true;
  //         }
  //       }
  //     },
  //     err => this.errorService.showError("dataset selection failed", err)
  //   );
}
