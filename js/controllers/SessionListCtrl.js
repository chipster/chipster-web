chipsterWeb.controller('SessionListCtrl', ['$scope', '$http', '$location','TemplateService','AuthenticationService', 
				function($scope, $http, $location,TemplateService, AuthenticationService){



//Set the edit session variables;
$scope.curSession=null;
$scope.isClicked=false;

$scope.exSessions=[];


	$scope.createSession=function(){
			//Do the post to http://localhost:8080/sessionstorage/sessions 
			//Creating a dummy session object
			var newSession=TemplateService.getSessionTemplate();		
			console.log(newSession);
			curSession=angular.copy(newSession); //assign it as the curSession

			$http({
              url:'http://vm0179.kaj.pouta.csc.fi:8080/sessionstorage/sessions/',
              method: "POST",
              withCredentials:true,
              headers: {'Authorization': 'Basic ' + btoa('token' + ':' +AuthenticationService.getToken())},
              data:curSession                   
              })
              .then(function (response) {
                if(response.data){
                	 $location.path("/session");
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
              url:'http://vm0179.kaj.pouta.csc.fi:8080/sessionstorage/sessions/',
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
			url:'http://vm0179.kaj.pouta.csc.fi:8080/sessionstorage/sessions/'+exSession.sessionId,
			method:"PUT",
			withCredentials:true,
			headers:{'Authorization': 'Basic ' + btoa("token" + ":"+ AuthenticationService.getToken())},
			data:exSession
		});

	};


	$scope.setCurClickedSession=function(exSession){

		$scope.curSession=angular.copy(exSession);
		$scope.isClicked=true;
		console.log(exSession.sessionId);
		$location.path("/session" + "/" + exSession.sessionId);
	};

	$scope.cancelClick=function(){
		$scope.curSession=null;
		$scope.isClicked=false;
	}

	$scope.isCurrentSession=function(sessionID){

		return $scope.curSession!=null && $scope.curSession.id==sessionID;

	}




	$scope.refreshSession=function(){
		//Do the Get
		//post to event listener at regular interval
		//user token:72891c2d-b855-4606-a8b2-da08a99c9015 -X GET http:
		//localhost:8080/sessionstorage/sessions/70ef2895-059e-4ff1-a1a1-e9e55c15a632/events
	};

	

	


}]);


