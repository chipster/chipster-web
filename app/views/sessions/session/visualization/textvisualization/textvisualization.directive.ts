import FileResource from "../../../../../resources/fileresource";
textVisualization.$inject = ['FileResource'];

function textVisualization(FileResource: FileResource) {
    return{
        restrict:'E',
        scope : {
            datasetId: "=",
            sessionId: "=",
            src: "="
        },
        template: "<p>{{data}}</p>",
        link: function ($scope: ng.IScope) {
            FileResource.getData($scope.sessionId, $scope.datasetId).then(function (resp: any) {
               $scope.data = resp.data;
            });
        }
    };
};

export default textVisualization;