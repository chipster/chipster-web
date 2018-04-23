import { SelectionService } from "../selection.service";
import Dataset from "../../../../model/session/dataset";
import * as _ from "lodash";
import visualizations from "./visualizationconstants";
import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { NgbTabChangeEvent } from "@ng-bootstrap/ng-bootstrap";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs/Observable";
import { SessionData } from "../../../../model/session/session-data";
import { TypeTagService } from "../../../../shared/services/typetag.service";
import { VisualizationModalService } from "./visualizationmodal.service";

@Component({
  selector: "ch-visualizations",
  templateUrl: "./visualizations.component.html",
  styleUrls: ["./visualizations.component.less"]
})
export class VisualizationsComponent implements OnInit, OnDestroy {
  static readonly TAB_ID_PREFIX: string = "ch-vis-tab-";

  @Input() private sessionData: SessionData;

  active: string; // id of the active vis tab
  visualizations: Array<any> = visualizations;

  datasetSelectionSubscription;
  selectedDatasets$: Observable<Array<Dataset>>;
  selectedDatasets: Array<Dataset>;
  private compatibleVisualizations = new Set<string>();

  constructor(
    private selectionService: SelectionService,
    private store: Store<any>,
    private typeTagService: TypeTagService,
    private visualizationModalService: VisualizationModalService
  ) {}

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
        if (!isActiveCompatible && this.selectedDatasets.length > 0) {
          this.active = this.getTabId(
            _.first(Array.from(this.compatibleVisualizations))
          );
        }
      }
    );
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
      this.containsTypeTags(visualization.typeTags) &&
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
