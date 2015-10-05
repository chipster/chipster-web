chipsterWeb.controller('LoginCtrl', ['$scope', '$location', '$http','AuthenticationService', 
              function($scope, $location, $http, AuthenticationService) {
 
  $scope.authUrl="";
  $scope.serviceUrl="";

  $scope.connect=function(){
    $http.get('http://localhost:8082/servicelocator/services')
      .then(function(res){
  
       angular.forEach(res.data,function(elem,index){
          if(elem.role==='session-storage'){
            $scope.serviceUrl=elem.uri;
          }
          if(elem.role==='authentication-service'){
            $scope.authUrl=elem.uri;
            console.log( $scope.authUrl);
          }
       });
      });

  };

  $scope.login=function(){

    var string=$scope.username + ":" +$scope.password;

    var encodedString=btoa(string); //Convert it to base64 encoded string
    

    $http({
              url: $scope.authUrl +'tokens',
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