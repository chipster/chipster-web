import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import Tool from "../../../model/session/tool";
import Utils from "../../../services/utils.service";
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
    isSelectedDataset(data: Dataset) {
        return this.selectedDatasets.indexOf(data) !== -1;
    }

    /**
     * Check if given job is selected
     * @param data
     * @returns {boolean}
     */
    isSelectedJob(data: Job) {
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

    toggleDatasetSelection($event: any, data: Dataset) {
        this.activeDatasetId = data.datasetId;
        Utils.toggleSelection($event, data, this.SessionDataService.getDatasetList(), this.selectedDatasets);
    }

    selectJob(event: any, job: Job) {
        this.clearSelection();
        this.selectedJobs = [job];
    }
}
