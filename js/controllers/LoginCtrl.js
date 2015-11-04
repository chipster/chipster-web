chipsterWeb.controller('LoginCtrl', ['$scope', '$location', '$http','AuthenticationService', 
              function($scope, $location, $http, AuthenticationService) {


  $scope.login=function(){

   
       //If the response ok, then request the token

      var string=$scope.username + ":" +$scope.password;

      var encodedString=btoa(string); //Convert it to base64 encoded string
     
      $http({
              url:'http://localhost:8000/auth/tokens',
              method: "POST",
              withCredentials:true,
              headers: {'Authorization': 'Basic ' + encodedString}                   
              })
              .then(function (response) {
                if(response.data.tokenKey){
                  AuthenticationService.setAuthToken(response.data.tokenKey);
                  //Route to Session creation page
                  $location.path("/sessions");

                }


              });
  };

  
  
}]);