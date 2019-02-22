import { SelectionService } from "../selection.service";
import { Dataset, Tool } from "chipster-js-common";
import * as _ from "lodash";
import visualizations from "./visualization-constants";
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { NgbTabChangeEvent } from "@ng-bootstrap/ng-bootstrap";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs/Observable";
import { SessionData } from "../../../../model/session/session-data";
import { TypeTagService } from "../../../../shared/services/typetag.service";
import { VisualizationModalService } from "./visualizationmodal.service";
import { ErrorService } from "../../../../core/errorhandler/error.service";


@Component({
  selector: "ch-visualizations",
  templateUrl: "./visualizations.component.html",
  styleUrls: ["./visualizations.component.less"]
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
  visualizations: Array<any> = visualizations;

  datasetSelectionSubscription;
  selectedDatasets$: Observable<Array<Dataset>>;
  selectedDatasets: Array<Dataset>;
  private compatibleVisualizations = new Set<string>();
  private tabChanged = false;


  constructor(
    public selectionService: SelectionService, // used in template
    private store: Store<any>,
    private typeTagService: TypeTagService,
    private visualizationModalService: VisualizationModalService,
    private errorService: ErrorService,

  ) { }

  ngOnInit() {
    this.selectedDatasets$ = this.store.select("selectedDatasets");

    this.datasetSelectionSubscription = this.selectedDatasets$.subscribe(
      (datasets: Array<Dataset>) => {
        this.selectedDatasets = datasets;
        this.compatibleVisualizations = new Set(
          this.getCompatibleVisualizations()
        );
        // check if the previous visualization is still compatible
        const isActiveCompatible =
          Array.from(this.compatibleVisualizations)
            .map(this.getTabId.bind(this))
            .indexOf(this.active) !== -1;


        /*
          We will get an empty selection in between when the selection is changed.
          Don't clear the active visualization because we want to try to show the
          same visualization for next selection too.
         */
        const notCompatibleAndNotTabChnanged = !isActiveCompatible && this.selectedDatasets.length > 0 && !this.tabChanged;
        const isCompatibleAndNotTabChanged = isActiveCompatible && this.selectedDatasets.length > 0 && !this.tabChanged;
        const notCompatibleAndTabChanged = !isActiveCompatible && this.selectedDatasets.length > 0 && this.tabChanged;

        // if the user changed the tab to details, then details will be shown, otherwise the first available visualization will be shown

        if (notCompatibleAndNotTabChnanged || isCompatibleAndNotTabChanged || notCompatibleAndTabChanged) {
          this.active = this.getTabId(
            _.first(Array.from(this.compatibleVisualizations))
          );
          this.tabChanged = false;
        }
        // need to emit some event to session top so that the tool and visulazation div scrollTop changes to show some part of tool section
        this.scrollFix.emit();

      }, err => this.errorService.showError("visualization change failed", err));
  }

  ngOnDestroy() {
    this.datasetSelectionSubscription.unsubscribe();
  }

  isTabVisible(id: string) {
    return this.compatibleVisualizations.has(id);
  }

  isCompatibleVisualization(id: string): boolean {
    const visualization = _.find(
      this.visualizations,
      visualization2 => visualization2.id === id
    );
    const datasetSelectionCount = this.selectedDatasets.length;
    return (
      (visualization.supportAllTypes ||
        this.containsTypeTags(visualization.typeTags)) &&
      (visualization.anyInputCountSupported ||
        _.includes(
          visualization.supportedInputFileCounts,
          datasetSelectionCount
        ))
    );
  }

  containsTypeTags(tags: Array<string>) {
    return _.every(
      this.selectionService.selectedDatasets,
      (dataset: Dataset) => {
        return _.some(tags, (tag: string) => {
          return this.typeTagService.isCompatible(
            this.sessionData,
            dataset,
            tag
          );
        });
      }
    );
  }

  getCompatibleVisualizations() {
    return this.visualizations
      .filter(vis => this.isCompatibleVisualization(vis.id))
      .map(vis => vis.id);
  }

  tabChange(event: NgbTabChangeEvent) {
    this.active = event.nextId;
    this.tabChanged = true;
  }

  //noinspection JSMethodCanBeStatic
  /**
   * Not static since used also from template
   * @param visId
   * @returns {string}
   */
  getTabId(visId: string) {
    return visId ? VisualizationsComponent.TAB_ID_PREFIX + visId : undefined;
  }

  openGenomeBrowser() {
    console.log(this.selectedDatasets);
    // this.visualizationModalService.openVisualizationModal(this.selectionService.selectedDatasets[0], 'genomebrowser');
    // window.open('genomebrowser');
  }
}
