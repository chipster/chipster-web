chipsterWeb.controller('SessionListCtrl',
				function($scope, $http, $location,SessionRestangular,TemplateService, AuthenticationService){

		//Set the edit session variables;
		$scope.curSession=null;
		$scope.isClicked=false;

		$scope.userSessions=[];
		$scope.showDetail=false;



	$scope.createSession=function(){
			
			var newSession=TemplateService.getSessionTemplate();		
			curSession=angular.copy(newSession); //assign it as the curSession


			SessionRestangular.one('sessions').customPOST(curSession)
				.then(function(res){
					if(res.headers){
						var sessionLocation=res.headers('Location');
						var sessionId=sessionLocation.substr(sessionLocation.lastIndexOf('/') + 1);
						$location.path("/session" + "/" + sessionId);
                	}
				});
		
	};

	$scope.getSessions=function(){
		SessionRestangular.all('sessions').getList()
			.then(function(res){
				$scope.userSessions=res.data;
			});
		
		//For the time being, getting example sessions from local json
		$http.get('js/json/exampleSession.json').then(function(res) {
			$scope.localSessions = res.data;
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
		return $scope.curSession!==null && $scope.curSession.id==sessionID;
	};


	$scope.refreshSessionList=function(){
		//Do the Get
		//post to event listener at regular interval
		//user token:72891c2d-b855-4606-a8b2-da08a99c9015 -X GET http:
		//localhost:8080/sessionstorage/sessions/70ef2895-059e-4ff1-a1a1-e9e55c15a632/events
	};
	
	$scope.deleteSession=function(exSession){
		var dlteSessionUrl=SessionRestangular.one('sessions').one(exSession.sessionId);
		
		dlteSessionUrl.remove().then(function(res){
			var index = $scope.exSessions.indexOf(exSession);
			$scope.userSessions.splice(index, 1);
		});
	};
	
	$scope.showSessionDetail=function(exSession){
		$scope.curSession=angular.copy(exSession);
		$scope.showDetail=true;
		//need to check whether the same session has been clicked again, 
		//in that case we need to hide the detail
	};
});


