"use strict";
var HtmlVisualizationController = (function () {
    function HtmlVisualizationController($sce) {
        this.$sce = $sce;
    }
    HtmlVisualizationController.prototype.getUrl = function () {
        return this.$sce.trustAsResourceUrl(this.src + '&download=false&type=true');
    };
    return HtmlVisualizationController;
}());
HtmlVisualizationController.$inject = ['$sce'];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    controller: HtmlVisualizationController,
    template: '<iframe frameBorder="0" sandbox="" width="100%" height="1000px" ng-src="{{$ctrl.getUrl()}}"></iframe>',
    bindings: {
        src: '='
    }
};
//# sourceMappingURL=htmlvisualization.component.js.map