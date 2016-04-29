/**
 * @desc Tool controller for controlling tool json requests and load the tool
 *       data in UI
 * @example <div ng-controller="ToolCtrl"></div>
 */
chipsterWeb.controller('ToolCtrl', function($scope, $q, ToolRestangular, $filter, Utils) {

	//initialization
	$scope.activeTab=0;//defines which tab is displayed as active tab in the beginning
	$scope.selectedCategoryIndex = -1;
	$scope.selectedCategory = null;
	$scope.selectedToolIndex = -1;

	$scope.$watch('data.modules', function () {
		// select the first module when the tools are loaded
		if ($scope.data.modules) {
			$scope.setTab($scope.activeTab);
		}
	});

	$scope.setTab=function($index){
		$scope.activeTab = $index;
		$scope.categories = $scope.data.modules[$index].categories;
		$scope.selectedCategory = null;
		$scope.selectedCategoryIndex = -1;
	};
	
	$scope.isSet=function($index){
		return $scope.activeTab === $index;
	};
	
	//defines which tool category the user have selected
	$scope.selectCategory = function(category, $index) {
		$scope.selectedCategoryIndex = $index;
		$scope.selectedCategory = category;
	};

	$scope.selectTool = function(toolId, $index) {

		$scope.selectedToolIndex = $index;

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
});


/**
 * Filter function to search for tool
 */

chipsterWeb.filter('searchFor',function(){
	
	return function(arr,searchTool){
		if(!searchTool)
			return arr;
	
	var result=[];
	angular.forEach(arr,function(item){
		
		if(item.name.indexOf(searchTool)!==-1){
			result.push(item);
		}
	});
	
	console.log(result);
	return result;
	}
	
});
