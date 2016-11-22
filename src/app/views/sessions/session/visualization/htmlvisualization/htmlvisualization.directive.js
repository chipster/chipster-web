"use strict";
var HtmlVisualizationController = (function () {
    function HtmlVisualizationController($sce, $scope) {
        this.$sce = $sce;
        this.$scope = $scope;
    }
    HtmlVisualizationController.prototype.getUrl = function () {
        console.log('getUrl()', this.$sce.trustAsResourceUrl(this.src + '&download=false&type=true'));
        return this.$sce.trustAsResourceUrl(this.src + '&download=false&type=true');
    };
    HtmlVisualizationController.$inject = ['$sce', '$scope'];
    return HtmlVisualizationController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    controller: HtmlVisualizationController,
    template: '<iframe frameBorder="0" sandbox="" width="100%" height="100%" ng-src="{{$ctrl.getUrl()}}"></iframe>',
    bindings: {
        src: '='
    }
};
//# sourceMappingURL=htmlvisualization.directive.js.map