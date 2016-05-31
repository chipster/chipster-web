chipsterWeb.controller('SessionListCtrl',
				function($scope, $http, $location,SessionRestangular){

	$scope.selectedSessions = [];
	$scope.userSessions=[];

	$scope.createSession=function(){
			
		var session = {
			sessionId: null,
			name: 'New session',
			notes: '',
			created: '2015-08-27T17:53:10.331Z',
			accessed: '2015-08-27T17:53:10.331Z'
		};

		SessionRestangular.one('sessions').customPOST(session).then(function(res){
			if(res.headers){
				var sessionLocation=res.headers('Location');
				session.sessionId = sessionLocation.substr(sessionLocation.lastIndexOf('/') + 1);
				$scope.openSession(session);
			}
		});
	};

	$scope.init = function () {
		$scope.setTitle('Sessions', false);
		$scope.updateSessions();
	};

	$scope.updateSessions = function(){

		SessionRestangular.all('sessions').getList().then(function(res){
			$scope.userSessions=res.data;
		}, function(response) {
			console.log('failed to get sessions', response);
			if (response.status === 403) {
				$location.path('/login');
			}
		});
	};

	$scope.openSession = function(session){
		$location.path("/session" + "/" + session.sessionId);
	};

	$scope.deleteSessions = function(sessions){

		angular.forEach(sessions, function(session) {
			var sessionUrl = SessionRestangular.one('sessions').one(session.sessionId);
			sessionUrl.remove().then(function(res) {
				console.log("session deleted", res);
				$scope.updateSessions();
				$scope.selectedSessions = [];
			});
		});
	};

	$scope.selectSession = function(event, session) {
		//Utils.toggleSelection(event, session, $scope.userSessions, $scope.selectedSessions);

		$scope.selectedSessions = [session];

		if ($scope.selectedSessions.length === 1) {
			if (session !== $scope.previousSession) {
				// hide the old session immediately
				$scope.previousSession = session;
				$scope.session = {};
				SessionRestangular.loadSession($scope.selectedSessions[0].sessionId).then(function(fullSession) {
					// don't show if the selection has already changed
					if ($scope.selectedSessions[0] === session) {
						$scope.$apply(function() {
								$scope.session = fullSession;
						});
					}
				});
			}
		}
	};

	$scope.isSessionSelected = function(session) {
		return $scope.selectedSessions.indexOf(session) !== -1;
	};

	var callback = {
		isSelectedDataset: function () {},
		isSelectedJob: function () {}
	};

	$scope.getWorkflowCallback = function() {
		return callback;
	};
});


