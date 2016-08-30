import Visualization from "./visualization";
import VisualizationList from "./visualizationconstants";
import SelectionService from "../selection.service";
import Dataset from "../../../../model/session/dataset";
import Utils from "../../../../services/utils.service";
import SessionDataService from "../sessiondata.service";

class VisualizationBoxComponent {

    static $inject = ['$scope', '$compile', 'SelectionService', 'SessionDataService'];

    visualizations: Visualization[] = VisualizationList;
    currentVisualization: Visualization = null;
    currentVisualizationDirective: any = null;

    constructor(
        private $scope: ng.IScope,
        private $compile: ng.ICompileService,
        private SelectionService: SelectionService,
        private SessionDataService: SessionDataService
    ) {}

    static isCompatibleWithDataset(visualization: Visualization, dataset: Dataset) {

        var extension = Utils.getFileExtension(dataset.name);
        return visualization.extensions.indexOf(extension.toLowerCase()) != -1;
    }

    $onInit() {
        this.$scope.$watchCollection(() => this.SelectionService.selectedDatasets, () => {
            this.setCurrentVisualization(null, null);
        });

        this.$scope.$on('showDefaultVisualization', () => {
            var visualizations = this.getVisualizations();
            if (visualizations.length > 0) {
                this.show(visualizations[0]);
            }
        });

        this.setCurrentVisualization(null, null);

        this.$scope.$on('showDefaultVisualization', () => {
            var visualizations = this.getVisualizations();
            if (visualizations.length > 0) {
                this.show(visualizations[0]);
            }
        });
    }

    $onChanges(changes: ng.IChangesObject) {
    }

    setCurrentVisualization(newVisualization: Visualization, directive: any) {

        if (this.currentVisualizationDirective) {
            this.currentVisualizationDirective.remove();
        }
        this.currentVisualization = newVisualization;
        this.currentVisualizationDirective = directive;
    }

    showPreview() {
        var visualizations = this.getVisualizations();
        return visualizations.length === 1 && visualizations[0].preview;
    }

    getVisualizations() {
        return this.visualizations.filter( (visualization: Visualization) => {
            return this.isCompatible(visualization);
        });
    }

    isCompatible(visualization: Visualization) {

        let datasets = this.SelectionService.selectedDatasets;

        if (datasets && datasets.length === 1) {
            return VisualizationBoxComponent.isCompatibleWithDataset(visualization, datasets[0]);
        }
        else if (datasets && datasets.length > 1 && visualization.multipleDatasets) {
            for (var i = 0; i < datasets.length; i++) {
                if (!VisualizationBoxComponent.isCompatibleWithDataset(visualization, datasets[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    show(vis: Visualization) {
        if (!this.SelectionService.isSingleDatasetSelected()) {
            console.log("trying to show visualization, but " + this.SelectionService.selectedDatasets.length + " datasets selected");
            return;
        }
        var directive = angular.element('<' + vis.directive + '/>');
        directive.attr('src', '$ctrl.getDatasetUrl()');
        directive.attr('dataset-id', '$ctrl.SelectionService.selectedDatasets[0].datasetId');
        directive.attr('selected-datasets', '$ctrl.SelectionService.selectedDatasets');
        this.$compile(directive)(this.$scope);
        var area = angular.element(document.getElementById("visualizationArea"));
        area.empty();
        area.append(directive);
        this.setCurrentVisualization(vis, directive);
    }

}

export default {
    controller: VisualizationBoxComponent,
    templateUrl: 'views/sessions/session/visualization/visualization.html'
}