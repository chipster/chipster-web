import Dataset from "./model/dataset";
import Job from "./model/job";
import Tool from "./model/tool";
import Utils from "../../../services/Utils";
import SessionDataService from "./sessiondata.service";

export default class SelectionService {

    static $inject = ['SessionDataService'];

    constructor(
        private SessionDataService: SessionDataService) {
    }

    // selections
    selectedDatasets: Dataset[] = [];
    selectedJobs: Job[] = [];

    activeDatasetId: string;

    // tool selection
    selectedTool: Tool = null;
    selectedToolIndex = -1;
    istoolselected = false;

    /**
     * Check if there are one or more dataset selected
     * @returns {boolean}
     */
    isDatasetSelected() {
        return this.selectedDatasets.length > 0;
    }

    /**
     * Check if there are one or more jobs selected
     * @returns {boolean}
     */
    isJobSelected() {
        return this.selectedJobs.length > 0;
    }

    /**
     * Check if given dataset is selected
     * @param data
     * @returns {boolean}
     */
    isSelectedDataset(data) {
        return this.selectedDatasets.indexOf(data) !== -1;
    }

    /**
     * Check if given job is selected
     * @param data
     * @returns {boolean}
     */
    isSelectedJob(data) {
        return this.selectedJobs.indexOf(data) !== -1;
    }

    /**
     * Check if single dataset is selected
     * @returns {boolean}
     */
    isSingleDatasetSelected() {
        return this.selectedDatasets.length == 1;
    }

    /**
     * Check if there are more than one datasets selected
     * @returns {boolean}
     */
    isMultipleDatasetsSelected() {
        return this.selectedDatasets.length > 1;
    }

    clearSelection() {
        this.selectedDatasets.length = 0;
        this.selectedJobs.length = 0;
    }

    toggleDatasetSelection($event, data) {
        this.activeDatasetId = data.datasetId;
        Utils.toggleSelection($event, data, this.SessionDataService.getDatasetList(), this.selectedDatasets);
    }

    selectJob(event, job) {
        this.clearSelection();
        this.selectedJobs = [job];
    }
}