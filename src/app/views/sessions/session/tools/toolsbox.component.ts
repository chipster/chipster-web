import SessionDataService from "../sessiondata.service";
import {ToolService} from "./tool.service";
import Category from "../../../../model/session/category";
import Module from "../../../../model/session/module";
import Job from "../../../../model/session/job";
import Dataset from "../../../../model/session/dataset";
import Tool from "../../../../model/session/tool";
import InputBinding from "../../../../model/session/inputbinding";
import SelectionService from "../selection.service";
import {IChipsterFilter} from "../../../../common/filter/chipsterfilter";
import Utils from "../../../../shared/utilities/utils";
import * as _ from "lodash";

class ToolsBox {

    static $inject = [
        '$filter', '$log', '$q', '$uibModal', 'ToolService', 'SessionDataService',
        'SelectionService'];

    constructor(
        private $filter: IChipsterFilter,
        private $log: ng.ILogService,
        private $q: ng.IQService,
        private $uibModal: any,
        private ToolService: ToolService,
        private SessionDataService: SessionDataService,
        private SelectionService: SelectionService) {
    }

    //initialization
    activeTab = 0;//defines which tab is displayed as active tab in the beginning
    selectedModule: Module = null;
    selectedCategory: Category = null;
    selectedTool: Tool = null;
    selectedDatasets: Dataset[] = [];
    inputBindings: InputBinding[] = null;
    modules: Module[];
    tools: Tool[]; // TODO remove?

    $onInit() {
        this.modules = _.cloneDeep(this.modules);
        this.selectedDatasets = this.SelectionService.selectedDatasets;

        // TODO do bindings for tools with no inputs?
    }


    // watch for data selection changes
    $doCheck() {
        if (this.selectedDatasets && (this.selectedDatasets.length !== this.SelectionService.selectedDatasets.length ||
            !Utils.equalStringArrays( Utils.getDatasetIds(this.selectedDatasets), Utils.getDatasetIds(this.SelectionService.selectedDatasets))) ) {

            // save for comparison
            this.selectedDatasets = _.cloneDeep(this.SelectionService.selectedDatasets);

            // bind if tool selected
            if (this.selectedTool) {
                this.$log.info("dataset selection changed -> binding inputs");
                this.inputBindings = this.ToolService.bindInputs(this.selectedTool, this.SelectionService.selectedDatasets);
            }
        }
    }


    isRunEnabled() {
        // TODO add mandatory parameters check

        // either bindings ok or tool without inputs
        return this.inputBindings ||
        (this.selectedTool && (!this.selectedTool.inputs || this.selectedTool.inputs.length === 0));
    }

    // Method for submitting a job
    runJob() {

        // create job
        let job: Job = <Job>{
            toolId: this.selectedTool.name.id,
            toolCategory: this.selectedCategory.name,
            toolName: this.selectedTool.name.displayName,
            toolDescription: this.selectedTool.description,
            state: 'NEW',
        };

        // set parameters
        job.parameters = [];
        for (let toolParam of this.selectedTool.parameters) {
            job.parameters.push({
                parameterId: toolParam.name.id,
                displayName: toolParam.name.displayName,
                description: toolParam.description,
                type: toolParam.type,
                value: toolParam.value
                // access selectionOptions, defaultValue, optional, from and to values from the toolParameter
            });
        }

        // set inputs
        job.inputs = [];

        // TODO bindings done already?
        if (!this.inputBindings) {
            this.$log.warn("no input bindings before running a job, binding now");
            this.inputBindings = this.ToolService.bindInputs(this.selectedTool, this.SelectionService.selectedDatasets);
        }

        for (let inputBinding of this.inputBindings) {

            // single input
            if (!this.ToolService.isMultiInput(inputBinding.toolInput)) {
                job.inputs.push({
                    inputId: inputBinding.toolInput.name.id,
                    description: inputBinding.toolInput.description,
                    datasetId: inputBinding.datasets[0].datasetId,
                    displayName: inputBinding.datasets[0].name
                });
            }

            // multi input
            else {
                let i = 0;
                for (let dataset of inputBinding.datasets) {
                    job.inputs.push({
                        inputId: this.ToolService.getMultiInputId(inputBinding.toolInput, i),
                        description: inputBinding.toolInput.description,
                        datasetId: dataset.datasetId,
                        displayName: dataset.name
                    });
                    i++;
                }
            }
        }
        // runsys
        this.SessionDataService.createJob(job);
    }

    openToolsModal() {
        var modalInstance = this.$uibModal.open({
            animation: true,
            templateUrl: './toolsmodal/toolsmodal.html',
            controller: 'ToolsModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                selectedTool: () => {
                    return this.selectedTool;
                },
                selectedCategory: () => {
                    return this.selectedCategory;
                },
                selectedModule: () => {
                    return this.selectedModule;
                },
                inputBindings: () => {
                    return this.inputBindings;
                },
                selectedDatasets: () => {
                    return _.cloneDeep(this.SelectionService.selectedDatasets);
                },
                isRunEnabled: () => {
                    return this.isRunEnabled();
                },
                modules: () => {
                    return this.modules;
                },

                // TODO remove?
                tools: () => {
                    return _.cloneDeep(this.tools);
                }
            }
        });

        modalInstance.result.then((result: any) => {
            // save settings
            this.selectedTool = result.selectedTool;
            this.selectedCategory = result.selectedCategory;
            this.selectedModule = result.selectedModule;
            this.inputBindings = result.inputBindings;

            if (result.run) {
                this.runJob();
            }
        }, function () {
            // modal dismissed
        });
    }

}

export default {
    bindings: {
        modules: '<',
        tools: '<' // TODO remove?
    },
    templateUrl: './tools.html',
    controller: ToolsBox
}

