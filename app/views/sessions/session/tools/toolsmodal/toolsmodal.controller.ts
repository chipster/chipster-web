
import Tool from "../../../../../model/session/tool";
import InputBinding from "../../../../../model/session/inputbinding";
import Dataset from "../../../../../model/session/dataset";
import ToolService from "../tool.service";
import ToolInput from "../../../../../model/session/toolinput";
import Module from "../../../../../model/session/module";
import Category from "../../../../../model/session/category";
import {IChipsterFilter} from "../../../../../common/filter/chipsterfilter";
import ToolParameter from "../../../../../model/session/toolparameter";
import TableService from "../../../../../services/tableservice.factory";
import Session from "../../../../../model/session/session";
import SessionDataService from "../../sessiondata.service";


export default class ToolsModalController {

    static $inject = ['$uibModalInstance', '$scope', '$filter', '$q','selectedTool', 'selectedCategory', 'selectedModule',
        'inputBindings', 'selectedDatasets', 'ToolService', 'TableService','SessionDataService', 'modules', 'tools'];

    private searchTool: string;
    private parameterDescription: string;

    // from ToolsService, used by template
    private isSelectionParameter: (parameter: ToolParameter) => boolean;
    private isNumberParameter: (parameter: ToolParameter) => boolean;

    constructor(
        private $uibModalInstance: any,
        private $scope: ng.IScope,
        private $filter: IChipsterFilter,
        private $q: ng.IQService,
        private selectedTool: Tool,
        private selectedCategory: Category,
        private selectedModule: Module,
        private inputBindings: InputBinding[],
        private selectedDatasets: Dataset[],
        private toolService: ToolService,
        private tableService: TableService,
        private sessionDataService: SessionDataService,
        //private isRunEnabled: boolean,
        private modules: Module[],
        private tools: Tool[]
    ) {

        // used from template
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


    // TODO add input field for this to template
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
        return this.selectedDatasets.length > 0 && this.selectedTool;
    }

    getCompatibleDatasets(toolInput: ToolInput) {
        return this.selectedDatasets.filter(function (dataset: Dataset) {
            return this.toolService.isCompatible(dataset, toolInput.type.name);
        });
    };

    setDescription(description: string) {
        this.parameterDescription = description;
    };

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


    // TODO move to service?
    populateParameterValues(parameter: ToolParameter) {

        if (!parameter.value) {
            parameter.value = this.getDefaultValue(parameter);
        }

        if (parameter.type === 'COLUMN_SEL') {
            this.getColumns().then( function (columns: string[]) {
                parameter.selectionOptions = columns.map(function (column) {
                    return {id: column};
                });
            });

            // reset value to empty if previous or default value is now invalid
            if (parameter.value && !this.selectionOptionsContains(parameter.selectionOptions, parameter.value)) {
                parameter.value = '';
            }
        }

        // TODO reset value to empty if previous or default value is now invalid
        if (parameter.type === 'METACOLUMN_SEL') {
            parameter.selectionOptions = this.getMetadataColumns().map( function (column) {
                return {id: column};
            });
        }
    }


    // TODO move to service?
    getColumns() {

        var promises: any[] = [];
        for (let dataset of this.selectedDatasets) {
            if (this.toolService.isCompatible(dataset, 'TSV')) {
                promises.push(this.tableService.getColumns(this.sessionDataService.getSessionId(), dataset.datasetId));
            }
        }

        return this.$q.all(promises).then(function(columnsOfSelectedDatasets: string[][]) {
            var columnSet = new Set<string>();
            for (let columns of columnsOfSelectedDatasets) {
                for (let column of columns) {
                    columnSet.add(column);
                }
            }

            return Array.from(columnSet);

        }, function(e: any) {
            console.log('failed to get columns', e);
        });
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
