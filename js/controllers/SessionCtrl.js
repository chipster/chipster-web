chipsterWeb.controller('SessionCtrl',
 function($http, $scope,$routeParams, TemplateService, SessionRestangular, AuthenticationService,$window,PanZoomService){

//SessionRestangular is a restangular object with configured baseUrl and
// authorization header

  $scope.sessionUrl=SessionRestangular.one('sessions',$routeParams.sessionId);

  // creating a session object
  $scope.session={
    sessionId:$routeParams.sessionId,
    sessionName:"",
    sessionDetail:"",
    workflowData:{}
  };
  
  //Dataset and tool for posting jobs
  $scope.selectedDatasetId=[];
  $scope.selectedToolId=null;
  $scope.selectedToolIndex=0;
  $scope.istoolselected=false;
    
  $scope.d3Data={nodes:[],links:[]};

  	 
  $scope.getSessionDetail=function(){
		//get session detail
		$scope.sessionUrl.get().then(function(result){
			$scope.session.sessionName=result.data.name;
			$scope.session.sessionDetail=result.data.notes;
			
		}, function(error){
			console.log(error);
		});

        // get datasets and jobs in parallel
        Promise.all([$scope.sessionUrl.all('datasets').getList(), $scope.sessionUrl.all('jobs').getList()])
                .then(function(resultArray) {
                	
           
            var datasets = resultArray[0].data.plain();
            console.log(datasets);
            var jobs = resultArray[1].data.plain();
            console.log(jobs);
        
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
                    links.push({source: sourceDataset.index, target: targetDataset.index, value: 4});
                    console.log("link created: " + sourceDataset.name + "->" + targetDataset.name);
                });
            });

            // set groups and levels
            angular.forEach(datasets,function(elem,index) {
                elem.group=1;
                elem.c_id=0;
                elem.level=index;
            });
            // we are done
            $scope.d3Data={nodes:datasets,links:links};

            console.log($scope.d3Data);
    
	});// End of promise function
};

	 $scope.editSession=function(){
	  var sessionObj=TemplateService.getSessionTemplate();
	
	  sessionObj.sessionId=$scope.session.sessionId;
	  sessionObj.name=$scope.session.sessionName;
	  sessionObj.notes=$scope.session.sessionDetail;
	
	  $scope.sessionUrl.customPUT(sessionObj);
	            
	};

	$scope.getDataSets=function(){
	  $scope.datalist=$scope.sessionUrl.all('datasets').getList();		 
	};


	$scope.addDataset=function(){
	
	  var newDataset=TemplateService.getDatasetTemplate();
	  console.log(newDataset);
	
	  var datasetUrl=$scope.sessionUrl.one('datasets');
	  datasetUrl.customPOST(newDataset).then(function(response){
		  alert("Dataset has been added");
		  //Add this new dataset to d3Data.node,this should update the dataset list and the graph also
	  });
	
	};


	$scope.getJobs=function(){
	  $scope.sessionUrl.getList('jobs');
	};
	
	$scope.runJob=function(){
		
		if($scope.selectedDatasetId.length<1){
			alert("No dataset selected");
			return;	
		}
		var newJob=TemplateService.getJobTemplate();
		
		if(!$scope.selectedToolId){
			alert("No tool selected");
			return;		
		}
		//edit the fields with selected parameter
		newJob.toolId=$scope.selectedToolId.tool;
		newJob.toolName=$scope.selectedToolId.name;
	
		angular.forEach($scope.selectedDatasetId, function(selectedDataId, index) {
			 newJob.inputs[index].datasetId=selectedDataId;
         });

		console.log(newJob);
			
		var postJobUrl=$scope.sessionUrl.one('jobs');
		postJobUrl.customPOST(newJob).then(function(response){
			alert("Job Submitted to server");
		});
			
	};
	
	// Binding datasetId from workflow graph directive
	this.setDatasetId=function(datasetId){
		$scope.selectedDatasetId.push(datasetId);
		console.log($scope.selectedDatasetId);
	};
	
	this.cancelDatasetSelection=function(datasetId){
		var index=$scope.selectedDatasetId.indexOf(datasetId);
		$scope.selectedDatasetId.splice(index,1);
	};
	
	
	$scope.selectedTool=function(tool,$index){
		$scope.selectedToolId=tool;
		$scope.selectedToolIndex = $index;
		$scope.istoolselected=true;
		console.log($scope.selectedToolIndex);
	};
	
	$scope.showToolDescription=function(){
		console.log( $scope.istoolselected);
		return $scope.istoolselected;
	}
	
	$scope.toggleToolSelection=function(){
		$scope.istoolselected=false;
		$scope.selectedToolIndex = 0;
	}
	
});

