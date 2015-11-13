chipsterWeb.controller('SessionCtrl', function($scope, $routeParams, $q,
		TemplateService, SessionRestangular, AuthenticationService,$websocket) {

	//SessionRestangular is a restangular object with configured baseUrl and
	//authorization header

	$scope.sessionUrl = SessionRestangular.one('sessions',
			$routeParams.sessionId);

	// creating a websocket object and start listening for the events
	var ws=$websocket.$new({
		url:'ws://localhost:8000/'+"sessiondbevents/"+"events/" + $routeParams.sessionId + "?token=" + AuthenticationService.getToken(),
		protocols: []
	});
	
	 ws.$on('$open', function () {
		 	console.log('connected through web socket'); 
		 	console.log(ws.$status()); // it prints ws.$OPEN
		  })
		  .$on('$message', function(event) { // it listens for 'incoming event'
		    console.log(event);
		    $scope.event=event;
		  })
		  .$on('$close',function(){
			  	console.log(ws.$status());
				console.log('Connection to web socket is closing');
		  });
	 
	// creating a session model object
	$scope.session = {
		sessionId : $routeParams.sessionId,
		sessionName : "",
		sessionDetail : "",
		workflowData : {}
	};
	
	//For view manipulation
	$scope.item=1;
	$scope.setItem = function(value) {
		$scope.item=value;
	};

	$scope.isSet = function(value) {
		return $scope.item === value;
	};

	//Dataset and tool for posting jobs
	$scope.selectedDatasetId = [];
	$scope.selectedToolId = null;
	$scope.selectedToolIndex = -1;
	$scope.istoolselected = false;
	
	//Dataset Detail showing
	$scope.dataNode=null;
	$scope.isDataNodeSelected=false;
	
	
	$scope.d3Data={nodes:[],links:[]};

	$scope.getSessionDetail = function() {
		//get session detail
		var promises = [ $scope.sessionUrl.get(),
		                 $scope.sessionUrl.all('datasets').getList(),
		                 $scope.sessionUrl.all('jobs').getList() ];

		$q.all(promises).then(
				function(res) {
					$scope.session.sessionName=res[0].data.name;
					$scope.session.sessionDetail=res[0].data.notes;
					
					//craete the workflow 
					var datasets = res[1].data;			
					var jobs = res[2].data;
					

					// create dicts
					var datasetDict = {};
					datasets.forEach(function(dataset) {
						datasetDict[dataset.datasetId] = dataset;
					});

					var jobDict = {};
					jobs.forEach(function(job) {
						jobDict[job.jobId] = job;
					});

					// assign indexes to datasets
					angular.forEach(datasets, function(dataset, index) {
						dataset.index = index;
					});

					// create links
					var links = [];
					datasets.forEach(function(targetDataset) {
						if (!targetDataset.sourceJob) {
							return; // continue
						}
						if (!(targetDataset.sourceJob in jobDict)) {
							//console.log("source job of dataset " + targetDataset.name + " isn't found");
							return; // continue
						}
						var sourceJob = jobDict[targetDataset.sourceJob];
						// iterate over the inputs of the source job
						sourceJob.inputs.forEach(function(input) {
							var sourceDataset = datasetDict[input.datasetId];
							links.push({
								source : sourceDataset.index,
								target : targetDataset.index,
								value : 4
							});
							console.log("link created: " + sourceDataset.name+ "->" + targetDataset.name);
						});
					});

					// set groups and levels
					angular.forEach(datasets, function(elem, index) {
						elem.group = 1;
						elem.c_id = 0;
						elem.level = index;
						
					});
					// we are done
					$scope.d3Data = {
						nodes : datasets,
						links : links
					};
					
					
				$scope.jobs=jobs;

				});
	};

	$scope.editSession = function() {
		var sessionObj = TemplateService.getSessionTemplate();

		sessionObj.sessionId = $scope.session.sessionId;
		sessionObj.name = $scope.session.sessionName;
		sessionObj.notes = $scope.session.sessionDetail;
		$scope.sessionUrl.customPUT(sessionObj).then(function(res){
			console.log(res);
		});

	};

	$scope.getDataSets = function() {
		$scope.datalist = $scope.sessionUrl.all('datasets').getList();
	};

	$scope.addDataset = function() {
		var newDataset = TemplateService.getDatasetTemplate();
		newDataset.x=TemplateService.getrandomX();
		newDataset.y=TemplateService.getrandomY();
		console.log(newDataset);
		var datasetUrl = $scope.sessionUrl.one('datasets');
		datasetUrl.customPOST(newDataset).then(function(response) {
			alert("Dataset has been added");
			$scope.d3Data.nodes.push(newDataset);
			
			//Refresh the session page
			//$scope.getSessionDetail();
		})
	};
	
	$scope.deleteDataset=function(datasetObj){
		
		//changing the file Id first
		var datasetUrl=$scope.sessionUrl.one('datasets').one(datasetObj.datasetId);
		datasetObj.fileId=TemplateService.getRandomFileID();
		
		console.log(datasetObj);
		//after that attempting to delete
		datasetUrl.customPUT(datasetObj).then(function(res){
			datasetUrl.remove().then(function(res){
				console.log(res);
			});
				
		});	
		
		
	};

	$scope.getJobs = function() {
		$scope.sessionUrl.getList('jobs').then(function(res){
			
		});
	};

	$scope.runJob = function() {

		if ($scope.selectedDatasetId.length < 1) {
			alert("No dataset selected");
			return;
		}
		var newJob = TemplateService.getJobTemplate();

		if (!$scope.selectedToolId) {
			alert("No tool selected");
			return;
		}
		//edit the fields with selected parameter
		newJob.toolId = $scope.selectedToolId.tool;
		newJob.toolName = $scope.selectedToolId.name;

		angular.forEach($scope.selectedDatasetId, function(selectedDataId,
				index) {
			newJob.inputs[index].datasetId = selectedDataId;
		});

		console.log(newJob);

		var postJobUrl = $scope.sessionUrl.one('jobs');
		postJobUrl.customPOST(newJob).then(function(response) {
			alert("Job Submitted to server");
			
		});

	};

	// Binding datasetId from workflow graph directive
	this.setDatasetId = function(datasetId) {
		$scope.selectedDatasetId.push(datasetId);
		console.log($scope.selectedDatasetId);
	};

	this.cancelDatasetSelection = function(datasetId) {
		var index = $scope.selectedDatasetId.indexOf(datasetId);
		$scope.selectedDatasetId.splice(index, 1);
	};
	
	
	$scope.selectedTool = function(tool, $index) {
		$scope.selectedToolId = tool;
		$scope.selectedToolIndex = $index;
		$scope.istoolselected = true;
	};

	$scope.showToolDescription = function() {
		return $scope.istoolselected;
	};

	$scope.toggleToolSelection = function() {
		$scope.istoolselected = false;
		$scope.selectedToolIndex = 0;
	};
	
	
	//implementing right click options for data nodes
	this.renameDataset=function(datasetObj,name){
		var datasetUrl=$scope.sessionUrl.one('datasets').one(datasetObj.datasetId);
		var renamedObj=angular.copy(datasetObj);
		renamedObj.name=name;
		
		//console.log(datasetObj);
		datasetUrl.customPUT(renamedObj).then(function(res){
			var index = $scope.d3Data.nodes.indexOf(datasetObj);
			console.log(index);
			$scope.d3Data.nodes.splice(index, 1,renamedObj);
			//$scope.getSessionDetail();
				
		});	
	};
	
	this.getSelectedDataNode=function(dataNode){
		$scope.dataNode=dataNode;
		console.log($scope.dataNode.name);
		$scope.isDataNodeSelected=true;
		
	};
	
	$scope.showDatasetDetail=function(){
		return $scope.isDataNodeSelected;
	};
	
	

});
