//Controller for specific processing tools
chipsterWeb.controller('AnalysisToolOptionCtrl', function($scope,$http){
	$scope.items = [
                    {
                        name: "item1",
                        desc: "Item 1",
                        subitems: [
                            {
                                name: "subitem1",
                                desc: "Sub-Item 1"
                            },
                            {
                                name: "subitem2",
                                desc: "Sub-Item 2"
                            },
                            {
                                name: "subitem3",
                                desc: "Sub-Item 3"
                            }]
                    },
                    {
                        name: "item2",
                        desc: "Item 2",
                        subitems: [
                            {
                                name: "subitem1",
                                desc: "Sub-Item 1"
                            },
                            {
                                name: "subitem2",
                                desc: "Sub-Item 2"
                            },
                            {
                                name: "subitem3",
                                desc: "Sub-Item 3"
                            }]
                    },
                    {
                        name: "item3",
                        desc: "Item 3",
                        subitems: [
                            {
                                name: "subitem1",
                                desc: "Sub-Item 1"
                            },
                            {
                                name: "subitem2",
                                desc: "Sub-Item 2"
                            },
                            {
                                name: "subitem3",
                                desc: "Sub-Item 3"
                            }]
                    }
                ];

$scope.default = $scope.items[2];

});


chipsterWeb.controller('ItemController',['$scope',function(scope){

	scope.$parent.isopen=(scope.$parent.default===scope.item);
	scope.$watch('isopen',function(newvalue,oldvalue,scope){
		scope.$parent.isopen=newvalue;

	});





}]);