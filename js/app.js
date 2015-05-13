angular.module('ChipsterWeb').config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/dataset',  {templateUrl: 'views/dataset.html'})
                  .when('/profile',  {templateUrl: 'views/profile.html'});
}]);



