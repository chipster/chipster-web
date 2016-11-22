"use strict";
var TextVisualizationController = (function () {
    function TextVisualizationController(fileResource, $scope, sessionDataService) {
        this.fileResource = fileResource;
        this.$scope = $scope;
        this.sessionDataService = sessionDataService;
    }
    TextVisualizationController.prototype.$onInit = function () {
        var _this = this;
        this.fileResource.getData(this.sessionDataService.getSessionId(), this.datasetId).then(function (resp) {
            _this.$scope.$apply(function () {
                _this.data = resp.data;
            });
        });
    };
    TextVisualizationController.prototype.createDataset = function () {
        this.sessionDataService.createDerivedDataset("dataset.tsv", [this.datasetId], "Text", this.data);
    };
    return TextVisualizationController;
}());
TextVisualizationController.$inject = ['FileResource', '$scope', 'SessionDataService'];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    controller: TextVisualizationController,
    template: '<button class="btn btn-default" ng-click="$ctrl.createDataset()">Create dataset</button><p>{{$ctrl.data}}</p>',
    bindings: {
        datasetId: '<'
    }
};
//# sourceMappingURL=textvisualization.component.js.map