import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import Tool from "../../../model/session/tool";
import UtilsService from "../../../services/utils.service";
import * as _ from "lodash";
import {Injectable} from "@angular/core";

@Injectable()
export default class SelectionService {

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

    toggleDatasetSelection($event: any, data: Dataset, allDatasets: any[]) {
        this.activeDatasetId = data.datasetId;

        UtilsService.toggleSelection($event, data, allDatasets, this.selectedDatasets);
        this.selectedDatasets = _.clone(this.selectedDatasets); // clone array so that changes on it can be tracen in $onChanges-block
    }

    clearSelection() {
        this.selectedDatasets.length = 0;
        this.selectedJobs.length = 0;
    }

    selectJob(event: any, job: Job) {
        this.clearSelection();
        this.selectedJobs = [job];
    }

}
