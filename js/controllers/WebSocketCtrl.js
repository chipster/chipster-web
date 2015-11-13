chipsterWeb.controller('WebSocketCtrl',function($scope,$websocket,AuthenticationService){
	
	
	var sessionId="a4cd876b-3f9b-4202-8b3f-f7aa31a739f9";
	
	
	// define the websocket addess
	var ws=$websocket.$new('ws://localhost:8000/'+"sessiondbevents/"+"events/" + sessionId + "?token=" + AuthenticationService.getToken());
	
	 ws.$on('$open', function () {
		 	console.log('connected through web socket'); 
		 	console.log(ws.$status()); // it prints ws.$OPEN
		  })
		  .$on('$message', function (message) { // it listents for 'incoming event'
		    console.log('something incoming from the server: ' + message);
		  })
		  .$on('$close',function(){
			  	console.log(ws.$status());
				console.log('Connection to web socket is closing');
		  });
	
	$scope.connectWS=function(){
		ws.$open();
	};
	
	$scope.disconnectWS=function(){
		ws.$close();	
	};
	
	
	
});