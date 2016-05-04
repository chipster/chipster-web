/**
 * @desc Tool controller for controlling tool json requests and load the tool
 *       data in UI
 * @example <div ng-controller="ToolCtrl"></div>
 */
chipsterWeb.controller('ToolCtrl', function($scope, $q, ToolRestangular, $filter, Utils) {

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

				if(tool.parameters.length>0){
					$scope.selected_t_parameter_list=tool.parameters;
				}else{
					$scope.enable_t_parameter=false;
				}
			}
		});
	};

	$scope.isRunEnabled = function() {
		return $scope.selectedDatasets.length > 0 && $scope.selectedTool;
	};

	$scope.isParametersEnabled = function() {
		return $scope.selectedTool && $scope.selectedTool.parameters.length > 0
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
		// see OperationDefinition.bindInputs()
		//TODO handle multi-inputs

		var jobInputs = [];
		for (var j = 0; j < tool.inputs.length; j++) {
			var toolInput = tool.inputs[j];

			if (toolInput.type === 'PHENODATA') {
				// should we check that it exists?
				continue;
			}

			var found = false;

			for (var i = 0; i < datasets.length; i++) {

				var dataset = datasets[i];
				if ($scope.isCompatible(dataset, toolInput.type.name)) {
					console.log(toolInput);
					var jobInput = {
						inputId: toolInput.name.id,
						description: toolInput.description,
						datasetId: dataset.datasetId,
						displayName: dataset.name
					};
					jobInputs.push(jobInput);
					found = true;
					break;
				}
			}
			if (!found) {
				// suitable datasets not found
				return null;
			}
		}
		return jobInputs;
	};

	// Method for submitting a job
	$scope.runJob = function () {

		var newJob = {
			toolId: $scope.selectedTool.name.id,
			toolCategory: $scope.selectedCategory.name,
			toolName: $scope.selectedTool.name.displayName,
			toolDescription: $scope.selectedTool.description,
			state: 'NEW',
			inputs: $scope.bindInputs($scope.selectedTool, $scope.selectedDatasets)
		};

		var postJobUrl = $scope.sessionUrl.one('jobs');
		postJobUrl.customPOST(newJob).then(function (response) {
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
