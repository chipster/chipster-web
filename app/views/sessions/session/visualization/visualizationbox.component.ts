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
    visualizations = visualizations;

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
            console.log(this.getPossibleVisualizations()    );
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
        return this.containsExtension(visualization.extensions) && (visualization.multipleDatasets === this.SelectionService.selectedDatasets.length > 1);
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

        return _.chain(this.visualizations)
            .filter( item => _.some( item.extensions, (extension: string) => _.includes(datasetFileExtensions, extension) ) )
            .map( item => item.id)
            .value();
    }

}

export default {
    controller: VisualizationBoxComponent,
    templateUrl: 'views/sessions/session/visualization/visualization.html'
}