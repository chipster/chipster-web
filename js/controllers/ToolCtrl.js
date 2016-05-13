/**
 * @desc Tool controller for controlling tool json requests and load the tool
 *       data in UI
 * @example <div ng-controller="ToolCtrl"></div>
 */
chipsterWeb.controller('ToolCtrl', function($scope, ToolRestangular, $filter, Utils, TableService, $q) {

	//initialization
	$scope.activeTab=0;//defines which tab is displayed as active tab in the beginning
	$scope.selectedCategory = null;

	$scope.$watch('data.modules', function () {
		// select the first module when the tools are loaded
		if ($scope.data.modules) {
			$scope.selectModule($scope.data.modules[0]);
		}
	});

	$scope.selectModule = function(module){
		$scope.selectedModule = module;
		$scope.categories = module.categories;
		$scope.selectFirstVisible();
	};
	
	//defines which tool category the user have selected
	$scope.selectCategory = function(category) {
		$scope.selectedCategory = category;
	};

	$scope.selectTool = function(toolId) {

		//find the relevant tool
		angular.forEach($scope.data.tools, function(tool) {
			if(tool.name.id === toolId) {
				$scope.selectedTool = tool;

				$scope.job = {
					toolId: $scope.selectedTool.name.id,
					toolCategory: $scope.selectedCategory.name,
					toolName: $scope.selectedTool.name.displayName,
					toolDescription: $scope.selectedTool.description,
					state: 'NEW',
					parameters: $scope.selectedTool.parameters.map($scope.getJobParameter)
				};
			}
		});

		$scope.inputBindings = $scope.bindInputs($scope.selectedTool, $scope.selectedDatasets);
	};

	$scope.isRunEnabled = function() {
		return $scope.selectedDatasets.length > 0 && $scope.selectedTool;
	};

	$scope.isParametersEnabled = function() {
		return $scope.selectedTool && $scope.selectedTool.parameters.length > 0
	};

	$scope.getCompatibleDatasets = function (toolInput) {
		return $scope.selectedDatasets.filter( function (dataset) {
			return $scope.isCompatible(dataset, toolInput.type.name);
		});
	};

	$scope.isCompatible = function(dataset, type) {

		// other than GENERIC should have more strict checks, like in  ChipsterInputTypes.isTypeOf()
		var alwaysCompatible = ['GENERIC', 'CDNA', 'GENE_EXPRS', 'GENELIST', 'PHENODATA'];

		if (alwaysCompatible.indexOf(type) !== -1) {
			return true;
		}

		var types = {
			// from BasicModule.plugContentTypes()
			TEXT: ['txt', 'dat', 'wee', 'seq', 'log', 'sam', 'fastq'],
			TSV: ['tsv'],
			CSV: ['csv'],
			PNG: ['png'],
			GIF: ['gif'],
			JPEG: ['jpg', 'jpeg'],
			PDF: ['pdf'],
			HTML: ['html', 'html'],
			// from MicroarrayModule.plugContentTypes()
			TRE: ['tre'],
			AFFY: ['cel'],
			BED: ['bed'],
			GTF: ['gtf', 'gff', 'gff2', 'gff3'],
			FASTA: ['fasta', 'fa', 'fna', 'fsa', 'mpfa'],
			FASTQ: ['fastq', 'fq'],
			GZIP: ['gz'],
			VCF: ['vcf'],
			BAM: ['bam'],
			QUAL: ['qual'],
			MOTHUR_OLIGOS: ['oligos'],
			MOTHUR_NAMES: ['names'],
			MOTHUR_GROUPS: ['groups'],
			SFF: ['sff']
		};

		var extension = Utils.getFileExtension(dataset.name);
		return types[type].indexOf(extension) !== -1;
	};

	$scope.bindInputs = function(tool, datasets) {

		// copy the array so that we can remove items from it
		var unboundDatasets = datasets.slice();

		// see OperationDefinition.bindInputs()
		//TODO handle multi-inputs

		var inputBindings = [];
		for (var j = 0; j < tool.inputs.length; j++) {
			var toolInput = tool.inputs[j];

			if (toolInput.type === 'PHENODATA') {
				// should we check that it exists?
				continue;
			}

			var found = false;

			for (var i = 0; i < unboundDatasets.length; i++) {

				var dataset = unboundDatasets[i];
				if ($scope.isCompatible(dataset, toolInput.type.name)) {

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
	};

	// Method for submitting a job
	$scope.runJob = function () {

		var jobToRun = angular.copy($scope.job);

		// toolParameters aren't needed anymore and the server doesn't accept extra fields
		for (jobParameter of jobToRun.parameters) {
			delete jobParameter.toolParameter;
		}

		jobToRun.inputs = [];

		for (inputBinding of $scope.inputBindings) {
			var jobInput = {
				inputId: inputBinding.toolInput.name.id,
				description: inputBinding.toolInput.description,
				datasetId: inputBinding.dataset.datasetId,
				displayName: inputBinding.dataset.name
			};
			jobToRun.inputs.push(jobInput);
		}

		var postJobUrl = $scope.sessionUrl.one('jobs');
		postJobUrl.customPOST(jobToRun).then(function (response) {
			console.log(response);
		});
	};

	$scope.selectFirstVisible = function () {

		var filteredModules = $filter('moduleFilter')($scope.data.modules, $scope.searchTool);
		if (filteredModules && filteredModules.indexOf($scope.selectedModule) < 0 && filteredModules[0]) {
			$scope.selectModule(filteredModules[0]);
		}

		var filteredCategories = $filter('categoryFilter')($scope.selectedModule.categories, $scope.searchTool);
		if (filteredCategories && filteredCategories.indexOf($scope.selectedCategory) < 0 && filteredCategories[0]) {
			$scope.selectCategory(filteredCategories[0]);
		}
	};

	$scope.toolSearchKeyEvent = function (e) {
		if (e.keyCode == 13) { // enter
			// select the first result
			var visibleTools = $filter('toolFilter')($scope.selectedCategory.tools, $scope.searchTool);
			if (visibleTools[0]) {
				$scope.searchTool = null;
				$scope.selectTool(visibleTools[0].id);
			}
		}
		if (e.keyCode == 27) { // escape key
			// clear the search
			$scope.searchTool = null;
		}
	};

	$scope.getSource = function () {
		if ($scope.selectedTool) {
			ToolRestangular.one('tools', $scope.selectedTool.name.id).customGET('source').then(function (response) {
				$scope.source = response.data;
			});
		}
	};

	$scope.isSelectionParameter = function (parameter) {
		return parameter.type === 'ENUM' ||
				parameter.type === 'COLUMN_SEL' ||
				parameter.type === 'METACOLUMN_SEL';
	};

	$scope.isNumberParameter = function (parameter) {
		return parameter.type === 'INTEGER' ||
				parameter.type === 'DECIMAL' ||
				parameter.type === 'PERCENT';
	};

	$scope.getDefaultValue = function (toolParameter) {
		if($scope.isNumberParameter(toolParameter)) {
			return Number(toolParameter.defaultValue);
		} else {
			return toolParameter.defaultValue;
		}
	};

	$scope.getDefaultValueDisplayName = function (toolParameter) {
		if (toolParameter.selectionOptions) {
			for (option of toolParameter.selectionOptions) {
				if (option.id === toolParameter.defaultValue) {
					return option.displayName || option.id;
				}
			}
		}
		return toolParameter.defaultValue;
	};

	$scope.getJobParameter = function (toolParameter) {

		var jobParameter = {
			parameterId: toolParameter.name.id,
			displayName: toolParameter.name.displayName,
			description: toolParameter.description,
			type: toolParameter.type,
			value: $scope.getDefaultValue(toolParameter),
			// access selectionOptions, defaultValue, optional, from and to values from the toolParameter
			toolParameter: toolParameter
		};

		if (toolParameter.type === 'COLUMN_SEL') {
			$scope.getColumns().then( function (columns) {
				jobParameter.toolParameter.selectionOptions = columns.map( function (column) {
					return {id: column};
				});
			});
		}

		if (toolParameter.type === 'METACOLUMN_SEL') {
			jobParameter.toolParameter.selectionOptions = $scope.getMetadataColumns().map( function (column) {
				return {id: column};
			});
		}

		return jobParameter;
	};

	$scope.getColumns = function () {
		var promises = [];
		angular.forEach($scope.selectedDatasets, function (dataset) {
			if ($scope.isCompatible(dataset, 'TSV')) {
				promises.push(TableService.getColumns($scope.getSessionId(), dataset.datasetId));
			}
		});

		return $q.all(promises).then(function(columnsOfSelectedDatasets) {
			var columnSet = new Set();
			for (columns of columnsOfSelectedDatasets) {
				for (column of columns) {
					columnSet.add(column);
				}
			}

			return Array.from(columnSet);

		}, function(e) {
			console.log('failed to get columns', e);
		});
	};

	$scope.getMetadataColumns = function () {

		var keySet = new Set();
		angular.forEach($scope.selectedDatasets, function(dataset) {
			angular.forEach(dataset.metadata, function (entry) {
				keySet.add(entry.key);
			});
		});

		return Array.from(keySet);
	};

	$scope.showDescription = function (description) {
		$scope.description = description;
	}
});


/**
 * Filter function to search for tool
 */

chipsterWeb.filter('toolFilter',function(){

	return function(arr,searchTool){
		if(!searchTool)
			return arr;

		var result=[];
		angular.forEach(arr,function(item){
			if(item.name.toLowerCase().indexOf(searchTool.toLowerCase())!==-1){
				result.push(item);
			}
		});

		return result;
	}

});

chipsterWeb.filter('categoryFilter', function($filter){
	
	return function(arr,searchTool){
		if(!searchTool)
			return arr;
	
		var result=[];

		angular.forEach(arr,function(category){
			var filteredTools = $filter('toolFilter')(category.tools, searchTool);

			if(filteredTools.length > 0){
				result.push(category);
			}
		});

		return result;
	}
});

chipsterWeb.filter('moduleFilter', function($filter){

	return function(arr,searchTool){
		if(!searchTool)
			return arr;

		var result=[];

		angular.forEach(arr,function(module){
			var filteredTools = $filter('categoryFilter')(module.categories, searchTool);

			if(filteredTools.length > 0){
				result.push(module);
			}
		});

		return result;
	}
});
