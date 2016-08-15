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

export default class ToolCtrl {


	static $inject = [
		'$scope', '$filter', 'TableService', '$q', '$uibModal', 'ToolService', 'SessionDataService',
		'SelectionService'];

	constructor(
		private $scope: ng.IScope,
		private $filter: ng.IFilterService,
		private TableService: TableService,
		private $q: ng.IQService,
		private $uibModal: any,
		private ToolService: ToolService,
		private SessionDataService: SessionDataService,
		private SelectionService: SelectionService) {

		this.init();
	}

	//initialization
	activeTab = 0;//defines which tab is displayed as active tab in the beginning
	selectedModule: Module = null;
	selectedCategory: Category = null;
	selectedTool: Tool = null;
	categories: Category[] = [];
	job: Job = null;
	inputBindings: InputBinding[] = null;
	searchTool: string;

	init() {
		this.$scope.$watch(() => this.getModules(), function () {
			// select the first module when the tools are loaded
			if (this.getModules()) {
				this.selectModule(this.getModules()[0]);
			}
		}.bind(this));
	}

	selectModule(module: Module){
		this.selectedModule = module;
		this.categories = module.categories;
		this.selectFirstVisible();
	}

	//defines which tool category the user have selected
	selectCategory(category: Category) {
		this.selectedCategory = category;
	}

	selectTool(toolId: string) {

		//find the relevant tool
		for (let tool of this.SessionDataService.tools) {
			if(tool.name.id === toolId) {
				this.selectedTool = tool;

				let jobParameters: JobParameter[] = [];
				for (let toolParameter of tool.parameters) {
					jobParameters.push(this.getJobParameter(toolParameter));
				}

				this.job = <Job>{
					toolId: tool.name.id,
					toolCategory: this.selectedCategory.name,
					toolName: tool.name.displayName,
					toolDescription: tool.description,
					state: 'NEW',
					parameters: jobParameters
				};
			}
		}

		this.inputBindings = this.bindInputs(this.selectedTool, this.SelectionService.selectedDatasets);

	}

	isRunEnabled() {
		return this.SelectionService.selectedDatasets.length > 0 && this.selectedTool;
	}

	isParametersEnabled() {
		return this.selectedTool && this.selectedTool.parameters.length > 0
	}

	bindInputs(tool: any, datasets: Dataset[]) {

		// copy the array so that we can remove items from it
		var unboundDatasets = datasets.slice();

		// see OperationDefinition.bindInputs()
		//TODO handle multi-inputs
		datasets.forEach( item => {console.log('dataset', item)});
		
		
		var inputBindings: InputBinding[] = [];
		for (var j = 0; j < tool.inputs.length; j++) {
			var toolInput = tool.inputs[j];

			if (toolInput.type === 'PHENODATA') {
				// should we check that it exists?
				continue;
			}

			var found = false;

			for (var i = 0; i < unboundDatasets.length; i++) {

				var dataset = unboundDatasets[i];
				if (this.ToolService.isCompatible(dataset, toolInput.type.name)) {

					inputBindings.push({
						toolInput: toolInput,
						dataset: dataset
					});
					// remove from datasets
					unboundDatasets.splice(unboundDatasets.indexOf(dataset), 1);
					found = true;
					break;
				}
			}
			if (!found) {
				// suitable datasets not found
				return null;
			}
		}

		return inputBindings;
	}

	// Method for submitting a job
	runJob() {

		var jobToRun: Job = angular.copy(this.job);

		// toolParameters aren't needed anymore and the server doesn't accept extra fields
		jobToRun.parameters.forEach(jobParameter => {delete jobParameter.toolParameter});

		//for (jobParameter of jobToRun.parameters) {
		//	delete jobParameter.toolParameter;
		//}

		jobToRun.inputs = [];

		for (let inputBinding of this.inputBindings) {
			jobToRun.inputs.push({
				inputId: inputBinding.toolInput.name.id,
				description: inputBinding.toolInput.description,
				datasetId: inputBinding.dataset.datasetId,
				displayName: inputBinding.dataset.name
			});
		}

		//for (inputBinding of $scope.inputBindings) {
		//	var jobInput = {
		//		inputId: inputBinding.toolInput.name.id,
		//		description: inputBinding.toolInput.description,
		//		datasetId: inputBinding.dataset.datasetId,
		//		displayName: inputBinding.dataset.name
		//	};
		//	jobToRun.inputs.push(jobInput);
		//}

		var postJobUrl = this.SessionDataService.sessionUrl.one('jobs');
		postJobUrl.customPOST(jobToRun).then(function (response: any) {
			console.log(response);
		});
	}

	selectFirstVisible() {

		var filteredModules = this.$filter('moduleFilter')(this.SessionDataService.modules, this.searchTool);
		if (filteredModules && filteredModules.indexOf(this.selectedModule) < 0 && filteredModules[0]) {
			this.selectModule(filteredModules[0]);
		}

		var filteredCategories = this.$filter('categoryFilter')(this.selectedModule.categories, this.searchTool);
		if (filteredCategories && filteredCategories.indexOf(this.selectedCategory) < 0 && filteredCategories[0]) {
			this.selectCategory(filteredCategories[0]);
		}
	}

	toolSearchKeyEvent(e: any) {
		if (e.keyCode == 13) { // enter
			// select the first result
			var visibleTools = this.$filter('toolFilter')(this.selectedCategory.tools, this.searchTool);
			if (visibleTools[0]) {
				this.searchTool = null;
				this.selectTool(visibleTools[0].id);
			}
		}
		if (e.keyCode == 27) { // escape key
			// clear the search
			this.searchTool = null;
		}
	}

	getJobParameter(toolParameter: ToolParameter): JobParameter {

		var jobParameter: JobParameter = {
			parameterId: toolParameter.name.id,
			displayName: toolParameter.name.displayName,
			description: toolParameter.description,
			type: toolParameter.type,
			value: this.ToolService.getDefaultValue(toolParameter),
			// access selectionOptions, defaultValue, optional, from and to values from the toolParameter
			toolParameter: toolParameter
		};

		if (toolParameter.type === 'COLUMN_SEL') {
			this.getColumns().then( function (columns: string[]) {
				jobParameter.toolParameter.selectionOptions = columns.map( function (column) {
					return {id: column};
				});
			});
		}

		if (toolParameter.type === 'METACOLUMN_SEL') {
			jobParameter.toolParameter.selectionOptions = this.getMetadataColumns().map( function (column) {
				return {id: column};
			});
		}

		return jobParameter;
	}

	getModules() {
		return this.SessionDataService.modules;
	}

	getColumns() {

		var promises: any[] = [];
		for (let dataset of this.SelectionService.selectedDatasets) {
			if (this.ToolService.isCompatible(dataset, 'TSV')) {
				promises.push(this.TableService.getColumns(this.SessionDataService.sessionId, dataset.datasetId));
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

	getMetadataColumns() {

		var keySet = new Set();
		for (let dataset of this.SelectionService.selectedDatasets) {
			for (let entry of dataset.metadata) {
				keySet.add(entry.key);
			}
		}
		return Array.from(keySet);
	}

	openParameterModal() {
		var modalInstance = this.$uibModal.open({
			animation: true,
			templateUrl: 'views/sessions/session/tools/parametermodal/parametermodal.html',
			controller: 'ParameterModalController',
			controllerAs: 'vm',
			bindToController: true,
			size: 'lg',
			resolve: {
				selectedTool: () => {
					return angular.copy(this.SelectionService.selectedTool);
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
				parameters: () => {
					return angular.copy(this.job.parameters)
				}
			}
		});

		modalInstance.result.then((result: any) => {
			// save settings
			this.job.parameters = result.parameters;
			this.inputBindings = result.inputBindings;
			if (result.run) {
				this.runJob();
			}
		}, function () {
			// modal dismissed
		});
	}

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
				}
			}
		});
	}
}

