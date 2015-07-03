chipsterWeb.directive('myModal', function($modal){

    return {
        transclude: true,
        restrict: 'EA',
        template: '<a ng-click="open()" ng-transclude>{{name}}</a>',
        scope: {
            useCtrl: "@",
            email: "@"
        },
        link: function(scope, element, attrs) {

            console.log('Attrs: ', attrs);
//            console.log('SCOPE: ', scope);Z

            scope.open = function(){


                var modalInstance = $modal.open({
                    templateUrl:'partials/login.html',
                    controller:  scope.useCtrl,
                    size: 'lg',
                    windowClass: 'app-modal-window',
                    backdrop: true,
                    resolve: {
                        custEmail: function(){
                            return {email: scope.email};
                        }
                    }

                });

                modalInstance.result.then(function(){
                    console.log('Finished');
                }, function(){
                    console.log('Modal dismissed at : ' + new Date());
                });
            };
        }
    };
});

chipsterWeb.controller('RedBullCtrl', function($scope, $modalInstance, custEmail){
    //add the scop
    $scope.custEmail = custEmail;

    $scope.ok = function(){
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});