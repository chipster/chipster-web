angular.module('ChipsterWeb').config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/dataset',  {templateUrl: 'partials/dataset.html'})
                  .when('/profile',  {templateUrl: 'partials/profile.html'});
}]);

