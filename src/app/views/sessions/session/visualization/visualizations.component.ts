import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { Store } from "@ngrx/store";
import { Dataset, Tool } from "chipster-js-common";
import { find, includes, every, some } from "lodash-es";
import { Subject } from "rxjs";
import { mergeMap, takeUntil, tap } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../model/session/session-data";
import { ConfigService } from "../../../../shared/services/config.service";
import { Tags, TypeTagService } from "../../../../shared/services/typetag.service";
import { DatasetService } from "../dataset.service";
import { SelectionService } from "../selection.service";
import VisualizationConstants, { Visualization } from "./visualization-constants";
import { VisualizationEventService } from "./visualization-event.service";

@Component({
  selector: "ch-visualizations",
  templateUrl: "./visualizations.component.html",
  styleUrls: ["./visualizations.component.less"],
})
export class VisualizationsComponent implements OnInit, OnDestroy {
  static readonly TAB_ID_PREFIX: string = "ch-vis-tab-";
  @Input()
  sessionData: SessionData;
  @Input()
  tools: Tool[];

  @Output()
  scrollFix = new EventEmitter();

  active: string; // id of the active vis tab
  visualizations: Array<Visualization> = VisualizationConstants.VISUALIZATIONS;

  selectedDatasets: Array<Dataset>;
  private compatibleVisualizations = new Set<string>();
  private userInitiatedTabChange = false;

  private unsubscribe: Subject<any> = new Subject();
  private visualizationBlacklist: Array<string>;

  constructor(
    public selectionService: SelectionService, // used in template
    private store: Store<any>,
    private typeTagService: TypeTagService,
    private errorService: ErrorService,
    private visualizationEventService: VisualizationEventService,
    private datasetService: DatasetService,
    private configService: ConfigService,
  ) {}

  ngOnInit() {
    this.configService
      .get("visualization-blacklist")
      .pipe(
        tap((blacklist) => (this.visualizationBlacklist = blacklist as unknown as string[])),
        mergeMap(() => this.store.select("selectedDatasets")),
        takeUntil(this.unsubscribe),
      )
      .subscribe(
        (datasets: Array<Dataset>) => {
          this.selectedDatasets = datasets;
          this.compatibleVisualizations = new Set(this.getCompatibleVisualizations());
          // check if the previous visualization is still compatible
          const isPreviousCompatible = Array.from(this.compatibleVisualizations)
            .map(this.getTabId.bind(this))
            .includes(this.active);

          // We will get an empty selection in between when the selection is changed.
          // Don't clear the active visualization because we want to try to show the
          // same visualization for next selection too.

          // Also, after previous was new tab, reset to first

          const previousNotCompatibleAndNotUserInitiated =
            !isPreviousCompatible && this.selectedDatasets.length > 0 && !this.userInitiatedTabChange;
          const previousIsCompatibleAndNotUserInitiated =
            isPreviousCompatible && this.selectedDatasets.length > 0 && !this.userInitiatedTabChange;
          const previousNotCompatibleAndUserInitiated =
            !isPreviousCompatible && this.selectedDatasets.length > 0 && this.userInitiatedTabChange;

          const previousWasPhenodata =
            this.selectedDatasets.length > 0 && this.active === this.getTabId(VisualizationConstants.PHENODATA_ID);

          const previousWasNewTab = this.active === this.getTabId(VisualizationConstants.NEW_TAB_ID);

          // if the user changed the tab to details, then details will be shown, otherwise the first available visualization will be shown
          if (
            previousWasPhenodata ||
            previousNotCompatibleAndNotUserInitiated ||
            previousIsCompatibleAndNotUserInitiated ||
            previousNotCompatibleAndUserInitiated ||
            previousWasNewTab
          ) {
            // if there's only new tab and details, select details to avoid automatic new tab
            const compatibleVisualizationsArray: string[] = Array.from(this.compatibleVisualizations);
            const firstOtherThanNewTab =
              compatibleVisualizationsArray[0] !== VisualizationConstants.NEW_TAB_ID
                ? compatibleVisualizationsArray[0]
                : compatibleVisualizationsArray[1];
            this.active = this.getTabId(firstOtherThanNewTab);
            this.userInitiatedTabChange = false;
          }
          // need to emit some event to session top so that the tool and visulazation div scrollTop
          // changes to show some part of tool section
          this.scrollFix.emit();
        },
        (err) => this.errorService.showError("visualization change failed", err),
      );

    this.visualizationEventService
      .getPhenodataSelectedStream()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((phenodataSelected) => {
        if (phenodataSelected) {
          this.active = this.getTabId(VisualizationConstants.PHENODATA_ID);
          this.userInitiatedTabChange = false;
          this.scrollFix.emit();
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }

  isTabVisible(id: string) {
    return this.compatibleVisualizations.has(id);
  }

  isCompatibleVisualization(id: string): boolean {
    const isBlacklisted = this.visualizationBlacklist.includes(id);

    // for now, only details and open in new tab support gzipped files
    if (
      this.selectedDatasets.some((dataset) => this.sessionData.datasetTypeTags.get(dataset.datasetId).has(Tags.GZIP)) &&
      !(id === VisualizationConstants.DETAILS_ID || id === VisualizationConstants.NEW_TAB_ID)
    ) {
      return false;
    }

    const visualization = find(this.visualizations, (visualization2) => visualization2.id === id);
    const datasetSelectionCount = this.selectedDatasets.length;

    const typeIsCompatible = visualization.supportAllTypes || this.containsTypeTags(visualization.typeTags);

    const inputCountIsCompatible =
      visualization.anyInputCountSupported || includes(visualization.supportedInputFileCounts, datasetSelectionCount);

    // here for now, to enable phenodata visualization for files which have their own
    // phenodata but which are not GENE_EXPR or BAM
    const phenodataSpecialCompatible =
      visualization.id === VisualizationConstants.PHENODATA_ID &&
      datasetSelectionCount === 1 &&
      this.datasetService.hasOwnPhenodata(this.selectedDatasets[0]);

    if (isBlacklisted) {
      return false;
    }
    return (typeIsCompatible && inputCountIsCompatible) || phenodataSpecialCompatible;
  }

  containsTypeTags(tags: Array<string>) {
    return every(this.selectionService.selectedDatasets, (dataset: Dataset) =>
      some(tags, (tag: string) => this.typeTagService.isCompatible(this.sessionData, dataset, tag)),
    );
  }

  getCompatibleVisualizations() {
    return this.visualizations.filter((vis) => this.isCompatibleVisualization(vis.id)).map((vis) => vis.id);
  }

  onNavChange(event) {
    this.active = event.nextId;
    this.userInitiatedTabChange = true;
  }

  /**
   * Not static since used also from template
   * @param visId
   * @returns {string}
   */
  getTabId(visId: string) {
    return visId ? VisualizationsComponent.TAB_ID_PREFIX + visId : undefined;
  }
}
