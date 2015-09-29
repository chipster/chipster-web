chipsterWeb.controller('SessionListCtrl', ['$scope', '$http', '$location','TemplateService','AuthenticationService', 
				function($scope, $http, $location,TemplateService, AuthenticationService){



//Set the edit session variables;
$scope.curSession=null;
$scope.isEditing=false;

$scope.exSessions=[];


	$scope.createSession=function(){
			//Do the post to http://localhost:8080/sessionstorage/sessions 
			//Creating a dummy session object
			var newSession=TemplateService.getSessionTemplate();		
			console.log(newSession);
			curSession=angular.copy(newSession); //assign it as the curSession

			$http({
              url:'http://localhost:8080/sessionstorage/sessions/',
              method: "POST",
              withCredentials:true,
              headers: {'Authorization': 'Basic ' + btoa('token' + ':' +AuthenticationService.getToken())},
              data:curSession                   
              })
              .then(function (response) {
                if(response.data){

                	 $location.path("/dataset");

                }
              });




			//get created location as response
			//http://localhost:8080/sessionstorage/sessions/70ef2895-059e-4ff1-a1a1-e9e55c15a632 
			//get back the session ID
	};

	$scope.getSessions=function(){
		var authToken=AuthenticationService.getToken();
		var encodedString="token" + ":" +authToken;
		console.log(encodedString);
		
		$http({
              url:'http://localhost:8080/sessionstorage/sessions/',
              method: "GET",
              withCredentials:true,
              headers: {'Authorization': 'Basic ' + btoa(encodedString)}                   
              })
              .then(function (response) {
                if(response.data){
                 //
                 $scope.exSessions=response.data;

                }
              });


	};

	$scope.updateSession=function(exSession){
		exSession.name="rq";
		console.log(exSession);

		$http({
			url:'http://localhost:8080/sessionstorage/sessions/'+exSession.sessionId,
			method:"PUT",
			withCredentials:true,
			headers:{'Authorization': 'Basic ' + btoa("token" + ":"+ AuthenticationService.getToken())},
			data:exSession
		});

	};


	$scope.setCurEditedSession=function(edSession){

		$scope.curSession=angular.copy(edSession);
		$scope.isEditing=true;
		console.log(edSession.sessionId);
		$location.path("/dataset" + "/" + edSession.sessionId);
	};

	$scope.cancelEditing=function(){
		$scope.curSession=null;
		$scope.isEditing=false;
	}

	$scope.isCurrentSession=function(sessionID){

		return $scope.edSession!=null && $scope.edSession.is==sessionID;

	}




	$scope.refreshSession=function(){
		//Do the Get
		//post to event listener at regular interval
		//user token:72891c2d-b855-4606-a8b2-da08a99c9015 -X GET http:
		//localhost:8080/sessionstorage/sessions/70ef2895-059e-4ff1-a1a1-e9e55c15a632/events
	};

	$scope.addDataset=function(){
		//create dataset template
		//Post to server
		console.log(curSession.name);

		var curDataset=TemplateService.getJobTemplate();
		//--user token:72891c2d-b855-4606-a8b2-da08a99c9015 -X POST http://localhost:8080/sessionstorage/sessions/
		//70ef2895-059e-4ff1-a1a1-e9e55c15a632/datasets

		$http({
			url:'http://localhost:8080/sessionstorage/sessions/'+curSession.sessionId+'/'+datasets,
			method:"POST",
			withCredentials:true,
			headers:{'Authorization': 'Basic ' + btoa("token" + ":"+ AuthenticationService.getToken())},
			data:curDataset
		});

		//get created location from the response and save the datasetID
		//http://localhost:8080/sessionstorage/sessions/70ef2895-059e-4ff1-a1a1-e9e55c15a632/
		//datasets/bc56439a-0ad9-40b6-8878-64fda9052478 

	};

	$scope.deleteDataset=function(){

	};

	$scope.updateDataset=function(){

	};

	$scope.addJob=function(){

	};


}]);


