import SessionDataService from "../sessiondata.service";
import ToolService from "./tool.service";
import TableService from "../../../../services/tableservice.factory"
import Category from "../../../../model/session/category";
import Module from "../../../../model/session/module";
import Job from "../../../../model/session/job";
import Dataset from "../../../../model/session/dataset";
import Tool from "../../../../model/session/tool";
import InputBinding from "../../../../model/session/inputbinding";
import ToolParameter from "../../../../model/session/toolparameter";
import JobParameter from "../../../../model/session/jobparameter";
import SelectionService from "../selection.service";
import {IChipsterFilter} from "../../../../common/filter/chipsterfilter";
import Utils from "../../../../services/utils.service";

class ToolsBox {

    static $inject = [
        '$scope', '$filter', '$log', 'TableService', '$q', '$uibModal', 'ToolService', 'SessionDataService',
        'SelectionService'];

    constructor(
        private $scope: ng.IScope,
        private $filter: IChipsterFilter,
        private $log: ng.ILogService,
        private TableService: TableService,
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

    $doCheck() {
        if (this.selectedDatasets.length !== this.SelectionService.selectedDatasets.length ||
            !Utils.equalStringArrays( Utils.getDatasetIds(this.selectedDatasets), Utils.getDatasetIds(this.SelectionService.selectedDatasets)) ) {

            // save for comparison
            this.selectedDatasets = angular.copy(this.SelectionService.selectedDatasets);

            // bind if tool selected
            if (this.selectedTool) {
                this.$log.info("dataset selection changed -> binding inputs");
                this.inputBindings = this.ToolService.bindInputs(this.selectedTool, this.SelectionService.selectedDatasets);
            }
        }
    }


    isRunEnabled() {
        return this.SelectionService.selectedDatasets.length > 0 && this.selectedTool;
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
            job.inputs.push({
                inputId: inputBinding.toolInput.name.id,
                description: inputBinding.toolInput.description,
                datasetId: inputBinding.dataset.datasetId,
                displayName: inputBinding.dataset.name
            });
        }

        // run
        this.SessionDataService.createJob(job);
    }


    openToolsModal() {
        var modalInstance = this.$uibModal.open({
            animation: true,
            templateUrl: 'views/sessions/session/tools/toolsmodal/toolsmodal.html',
            controller: 'ToolsModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                selectedTool: () => {
                    // return angular.copy(this.selectedTool);
                    return this.selectedTool;
                },
                selectedCategory: () => {
                    //return angular.copy(this.selectedCategory);
                    return this.selectedCategory;
                },
                selectedModule: () => {
                    //return angular.copy(this.selectedModule);
                    return this.selectedModule;
                },
                inputBindings: () => {
                    return angular.copy(this.inputBindings);
                },
                selectedDatasets: () => {
                    return angular.copy(this.SelectionService.selectedDatasets);
                },
                isRunEnabled: () => {
                    return this.isRunEnabled();
                },
                modules: () => {
                    // return angular.copy(this.modules);
                    return this.modules;
                },

                // TODO remove?
                tools: () => {
                    return angular.copy(this.tools);
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


    // TODO move to tools modal / service
    openSourceModal() {
        this.$uibModal.open({
            animation: true,
            templateUrl: 'views/sessions/session/tools/sourcemodal/sourcemodal.html',
            controller: 'SourceModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                selectedTool: function () {
                    return angular.copy(this.selectedTool);
                }.bind(this)
            }
        });
    }
}

export default {
    bindings: {
        modules: '<',
        tools: '<' // TODO remove?
    },
    templateUrl: 'views/sessions/session/tools/tools.html',
    controller: ToolsBox
}

