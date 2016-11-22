"use strict";
var PdfVisualizationController = (function () {
    function PdfVisualizationController($scope) {
        this.$scope = $scope;
        // the pdf library assumes these are in $scope
        this.$scope.pdfUrl = this.src;
        this.$scope.pdfFileName = 'PDF file'; //name of the pdf result file to view
        this.$scope.loading = 'loading';
        this.$scope.onError = this.onError.bind(this);
        this.$scope.onLoad = this.onLoad.bind(this);
        this.$scope.onProgress = this.onProgress.bind(this);
    }
    PdfVisualizationController.prototype.getNavStyle = function (scroll) {
        if (scroll > 100) {
            return 'pdf-controls fixed';
        }
        else {
            return 'pdf-controls';
        }
    };
    PdfVisualizationController.prototype.onError = function (error) {
        console.log('pdf error', error);
    };
    PdfVisualizationController.prototype.onLoad = function () {
        this.$scope.loading = '';
    };
    PdfVisualizationController.prototype.onProgress = function (progress) {
    };
    PdfVisualizationController.prototype.goPrevious = function () {
        this.$scope.goPrevious();
    };
    PdfVisualizationController.prototype.goNext = function () {
        this.$scope.goNext();
    };
    PdfVisualizationController.prototype.zoomIn = function () {
        this.$scope.zoomIn();
    };
    PdfVisualizationController.prototype.zoomOut = function () {
        this.$scope.zoomOut();
    };
    return PdfVisualizationController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    controller: PdfVisualizationController,
    template: '<ng-pdf template-url="app/views/sessions/session/visualization/pdf/viewer.html" scale="page-fit"></ng-pdf>',
    bindings: {
        src: '='
    }
};
//# sourceMappingURL=pdfvisualization.component.js.map