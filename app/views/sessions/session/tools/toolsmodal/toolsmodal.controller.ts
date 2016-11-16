
import Tool from "../../../../../model/session/tool";
import InputBinding from "../../../../../model/session/inputbinding";
import Dataset from "../../../../../model/session/dataset";
import ToolService from "../tool.service";
import Module from "../../../../../model/session/module";
import Category from "../../../../../model/session/category";
import {IChipsterFilter} from "../../../../../common/filter/chipsterfilter";
import ToolParameter from "../../../../../model/session/toolparameter";
import SessionDataService from "../../sessiondata.service";
import {Observable} from "rxjs/Rx";
import TSVFile from "../../../../../model/tsv/TSVFile";
import {TSVReader} from "../../../../../services/TSVReader";

export default class ToolsModalController {

    static $inject = ['$uibModalInstance', '$uibModal', '$scope', '$filter', '$q','selectedTool', 'selectedCategory', 'selectedModule',
        'inputBindings', 'selectedDatasets', 'ToolService', 'TSVReader','SessionDataService', 'modules', 'tools'];

    private searchTool: string;
    private parameterDescription: string;
    private inputDescription: string;

    // from ToolsService, used by template
    private isSelectionParameter: (parameter: ToolParameter) => boolean;
    private isNumberParameter: (parameter: ToolParameter) => boolean;

    constructor(
        private $uibModalInstance: any,
        private $uibModal: any,
        private $scope: ng.IScope,
        private $filter: IChipsterFilter,
        private $q: ng.IQService,
        private selectedTool: Tool,
        private selectedCategory: Category,
        private selectedModule: Module,
        private inputBindings: InputBinding[],
        private selectedDatasets: Dataset[],
        private toolService: ToolService,
        private tsvReader: TSVReader,
        private sessionDataService: SessionDataService,
        private modules: Module[],
        private tools: Tool[]) {

        // used by template
        this.isSelectionParameter = toolService.isSelectionParameter;
        this.isNumberParameter = toolService.isNumberParameter;
    }

    $onInit() {

        // catch dismiss and do close instead
        this.$scope.$on('modal.closing', (event: any, reason: string, closed: boolean) => {
            if (!closed) {
                event.preventDefault();
                this.close(false);
            }
        });

        // trigger parameter validation
        if (this.selectedTool) {
            this.selectTool(this.selectedTool);
        }

        if (!this.selectedModule) {
            this.selectModule(this.modules[0]);
        }
    }

    selectModule(module: Module) {
        this.selectedModule = module;
        this.selectFirstVisible();
    }

    //defines which tool category the user have selected
    selectCategory(category: Category) {
        this.selectedCategory = category;
    }

    selectFirstVisible() {

        var filteredModules = this.$filter('moduleFilter')(this.modules, this.searchTool);
        if (filteredModules && filteredModules.indexOf(this.selectedModule) < 0 && filteredModules[0]) {
            this.selectModule(filteredModules[0]);
        }

        var filteredCategories = this.$filter('categoryFilter')(this.selectedModule.categories, this.searchTool);
        if (filteredCategories && filteredCategories.indexOf(this.selectedCategory) < 0 && filteredCategories[0]) {
            this.selectCategory(filteredCategories[0]);
        }
    }


    selectTool(tool: Tool) {

        this.selectedTool = tool;

        // TODO reset col_sel and metacol_sel if selected dataset has changed
        for (let param of tool.parameters) {
            this.populateParameterValues(param);
        }

        this.inputBindings = this.toolService.bindInputs(this.selectedTool, this.selectedDatasets);
    }


    toolSearchKeyEvent(e: any) {
        if (e.keyCode == 13) { // enter
            // select the first result
            var visibleTools = this.$filter('toolFilter')(this.selectedCategory.tools, this.searchTool);
            if (visibleTools[0]) {
                this.searchTool = null;
                // this.selectTool(visibleTools[0].name.id);
                this.selectTool(visibleTools[0]);
            }
        }
        if (e.keyCode == 27) { // escape key
            // clear the search
            this.searchTool = null;
        }
    }


    isRunEnabled() {
        // TODO add mandatory parameters check

        // either bindings ok or tool without inputs
        return this.inputBindings ||
            (this.selectedTool && (!this.selectedTool.inputs || this.selectedTool.inputs.length === 0));
    }

    setDescription(description: string) {
        this.parameterDescription = description;
    };

    setInputDescription(description: string) {
        this.inputDescription = description;
    }

    runJob() {
        this.close(true);
    };

    close(run: boolean) {
        this.$uibModalInstance.close({
            selectedTool: this.selectedTool,
            selectedCategory: this.selectedCategory,
            selectedModule: this.selectedModule,
            inputBindings: this.inputBindings,
            run: run
        });
    };

    dismiss() {
        this.$uibModalInstance.dismiss();
    };





    openInputsModal() {
        let modalInstance = this.$uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/tools/inputsmodal/inputsmodal.html',
            controller: 'InputsModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {

                selectedTool: () => {
                    return _.cloneDeep(this.selectedTool);
                },
                moduleName: () => {
                    return this.selectedModule.name;
                },
                categoryName: () => {
                    return this.selectedCategory.name;
                },
                inputBindings: () => {
                    return this.inputBindings;
                },
                selectedDatasets: () => {
                    return _.cloneDeep(this.selectedDatasets);
                }
            }
        });

        modalInstance.result.then((result: any) => {
            this.inputBindings = result.inputBindings;

        }, function () {
            // modal dismissed
        });

    }


    openSourceModal() {
        this.$uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/tools/sourcemodal/sourcemodal.html',
            controller: 'SourceModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {

                selectedTool: () => {
                    return _.cloneDeep(this.selectedTool);
                },
                category: () => {
                    return this.selectedCategory.name;
                },
                module: () => {
                    return this.selectedModule.name;
                }
            }
        });
    }

    // TODO move to service?
    getDatasetHeaders() : Observable<TSVFile>[] {
        return this.selectedDatasets.map( (dataset: Dataset) => this.tsvReader.getTSVFile(this.sessionDataService.getSessionId(), dataset.datasetId));
    }

    // TODO move to service?
    populateParameterValues(parameter: ToolParameter) {
        if (!parameter.value) {
            parameter.value = this.toolService.getDefaultValue(parameter);
        }

        if (parameter.type === 'COLUMN_SEL') {
            Observable.forkJoin(this.getDatasetHeaders()).subscribe( (tsvFiles: Array<TSVFile>) => {
                let columns = _.uniq( _.flatten(tsvFiles.map( (tsvFile: TSVFile) => tsvFile.headers.headers)) );
                parameter.selectionOptions = columns.map(function (column) {
                    return {id: column};
                });

                // reset value to empty if previous or default value is now invalid
                if (parameter.value && !this.selectionOptionsContains(parameter.selectionOptions, parameter.value)) {
                    parameter.value = '';
                }

            });


        }

        // TODO reset value to empty if previous or default value is now invalid
        if (parameter.type === 'METACOLUMN_SEL') {
            parameter.selectionOptions = this.getMetadataColumns().map( function (column) {
                return {id: column};
            });
        }
    }

    // TODO move to service
    getMetadataColumns() {

        var keySet = new Set();
        for (let dataset of this.selectedDatasets) {
            for (let entry of dataset.metadata) {
                keySet.add(entry.key);
            }
        }
        return Array.from(keySet);
    }

    selectionOptionsContains(options: any[], value: string | number) {
        for (let option of options) {
            if (value === option.id) {
                return true;
            }
        }
        return false;
    }

}
