import SelectionService from "../selection.service";
import Dataset from "../../../../model/session/dataset";
import Utils from "../../../../services/utils.service";
import SessionDataService from "../sessiondata.service";
import * as _ from "lodash";
import visualizations from "./visualizationconstants";

class VisualizationBoxComponent {

    static $inject = ['SelectionService', 'SessionDataService', '$timeout'];

    datasets: Array<Dataset>;
    active: string;
    visualizations: Array<any> = visualizations;

    constructor(
        private SelectionService: SelectionService,
        private SessionDataService: SessionDataService,
        private $timeout: ng.ITimeoutService) {
    }

    $onInit() {
        this.datasets = [];
        this.active = _.first(this.getPossibleVisualizations());
    }

    $doCheck() {
        if(!_.isEqual(this.datasets, this.SelectionService.selectedDatasets)) {
            this.active = undefined;
            this.datasets = _.cloneDeep(this.SelectionService.selectedDatasets);

            // set timeout with 0 forces removing tab content from dom
            // so that tab content will be drawn again. Otherwise tab-content
            // won't change since it's not listening dataset selection changes
            this.$timeout( () => {
                this.active = _.first(this.getPossibleVisualizations());
            }, 0);
        }
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

}

export default {
    controller: VisualizationBoxComponent,
    templateUrl: './visualization.html'
}