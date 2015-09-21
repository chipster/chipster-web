chipsterWeb.controller('SessionCtrl', ['$scope', '$http', 'TemplateService','AuthenticationService', 
				function($scope, $http, TemplateService, AuthenticationService){

	var exSessions=[];


	$scope.createSession=function(){
			//Do the post to http://localhost:8080/sessionstorage/sessions 

			var exSession=TemplateService.getSessionTemplate();

			$http({
              url:'http://localhost:8080/sessionstorage/sessions/',
              method: "POST",
              withCredentials:true,
              headers: {'Authorization': 'Basic ' + btoa("token" + ":" +AuthenticationService.getToken())},
              data:exSession                   
              })
              .then(function (response) {
                if(response.data){
                	

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

		$http({
			url:'http://localhost:8080/sessionstorage/sessions/'+exSession.sessionId,
			method:"PUT",
			withCredentials:true,
			headers:{'Authorization': 'Basic ' + btoa("token" + ":"+ AuthenticationService.getToken())}
		});

	};

	$scope.refreshSession=function(){
		//Do the Get
		//post to event listener at regular interval
		//user token:72891c2d-b855-4606-a8b2-da08a99c9015 -X GET http:
		//localhost:8080/sessionstorage/sessions/70ef2895-059e-4ff1-a1a1-e9e55c15a632/events
	};

	$scope.addDataset=function(){
		//create dataset template
		//Post to server
		//--user token:72891c2d-b855-4606-a8b2-da08a99c9015 -X POST http://localhost:8080/sessionstorage/sessions/
		//70ef2895-059e-4ff1-a1a1-e9e55c15a632/datasets

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


