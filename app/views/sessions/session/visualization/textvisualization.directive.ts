textVisualization.$inject = ['FileResource'];

function textVisualization(FileResource) {
    return{
        restrict:'E',
        scope : {
            datasetId: "=",
            sessionId: "=",
            src: "="
        },
        template: "<p>{{data}}</p>",
        link: function ($scope) {
            FileResource.getData($scope.sessionId, $scope.datasetId).then(function (resp) {
               $scope.data = resp.data;
            });
        }
    };
};

export default textVisualization;