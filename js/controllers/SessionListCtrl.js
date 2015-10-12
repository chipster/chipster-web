chipsterWeb.controller('SessionListCtrl',
				function($scope, $http, $location,SessionRestangular,TemplateService, AuthenticationService){

		//Set the edit session variables;
		$scope.curSession=null;
		$scope.isClicked=false;

		$scope.exSessions=[];



	$scope.createSession=function(){
			
			var newSession=TemplateService.getSessionTemplate();		
			curSession=angular.copy(newSession); //assign it as the curSession


			SessionRestangular.one('sessions').customPOST(curSession)
				.then(function(res){
					if(res.headers){
						var sessionLocation=res.headers('Location');
						var sessionId=sessionLocation.substr(sessionLocation.lastIndexOf('/') + 1);
						$location.path("/session" + "/" + sessionId)
                	}
				});
		
	};

	$scope.getSessions=function(){
		SessionRestangular.all('sessions').getList()
			.then(function(res){
				$scope.exSessions=res.data;
			});
	};



	$scope.setCurClickedSession=function(exSession){
		$scope.curSession=angular.copy(exSession);
		$scope.isClicked=true;
		$location.path("/session" + "/" + exSession.sessionId);
	};

	$scope.cancelClick=function(){
		$scope.curSession=null;
		$scope.isClicked=false;
	};

	$scope.isCurrentSession=function(sessionID){

		return $scope.curSession!=null && $scope.curSession.id==sessionID;

	};


	$scope.refreshSessionList=function(){
		//Do the Get
		//post to event listener at regular interval
		//user token:72891c2d-b855-4606-a8b2-da08a99c9015 -X GET http:
		//localhost:8080/sessionstorage/sessions/70ef2895-059e-4ff1-a1a1-e9e55c15a632/events
	};


	
	

	


});


