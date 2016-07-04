textVisualization.$inject = ['FileRestangular'];

function textVisualization(FileRestangular) {
    return{
        restrict:'E',
        scope : {
            datasetId: "=",
            sessionId: "=",
            src: "="
        },
        template: "<p>{{data}}</p>",
        link: function ($scope) {
            FileRestangular.getData($scope.sessionId, $scope.datasetId).then(function (resp) {
               $scope.data = resp.data;
            });
        }
    };
};

export default textVisualization;