import SelectionService from "../selection.service";
import Dataset from "../../../../model/session/dataset";
import Utils from "../../../../shared/utilities/utils";
import * as _ from "lodash";
import visualizations from "./visualizationconstants";
import {Component, ChangeDetectorRef} from "@angular/core";
import {NgbTabChangeEvent} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'ch-visualizations',
  templateUrl: './visualizations.html'
})
export class VisualizationsComponent {

  static readonly TAB_ID_PREFIX: string = 'ch-vis-tab-';

  active: string; // id of the active vis tab
  visualizations: Array<any> = visualizations;

  constructor(private SelectionService: SelectionService,
              private changeDetectorRef: ChangeDetectorRef,) {}

  ngOnInit() {
    this.active = this.getTabId(_.first(this.getPossibleVisualizations()));

    this.SelectionService.getDatasetSelectionStream().subscribe(() => {
      this.active = this.getTabId(_.first(this.getPossibleVisualizations()));
      this.changeDetectorRef.detectChanges(); // needed to trigger tab content update
    });
  }

  isCompatibleVisualization(name: string): boolean {
    let visualization = _.find(this.visualizations, visualization => visualization.id === name);
    let datasetSelectionCount = this.SelectionService.selectedDatasets.length;
    return this.containsExtension(visualization.extensions) && ( visualization.anyInputCountSupported || _.includes(visualization.supportedInputFileCounts, datasetSelectionCount) )
  }

  containsExtension(extensions: Array<string>) {
    return _.every(this.SelectionService.selectedDatasets, (dataset: Dataset) => {
      return _.includes(extensions, Utils.getFileExtension(dataset.name));
    });
  }

  getPossibleVisualizations() {
    let datasetFileExtensions = _.map(this.SelectionService.selectedDatasets, (dataset: Dataset) => {
      return Utils.getFileExtension(dataset.name);
    });

    const selectionCount = datasetFileExtensions.length;
    const sameFileTypes = _.uniq(datasetFileExtensions).length === 1;

    return sameFileTypes ? _.chain(this.visualizations)
      .filter( visualization => _.some( visualization.extensions, (extension: string) => {

        let appropriateInputFileCount = (visualization.anyInputCountSupported || _.includes(visualization.supportedInputFileCounts, selectionCount));
        let visualizationSupportsFileType = _.includes(datasetFileExtensions, extension);

        return appropriateInputFileCount && visualizationSupportsFileType;
      }) )
      .map( item => item.id)
      .value() : [];
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
}
