import IScope = angular.IScope;

interface PdfScope extends IScope {
    pdfUrl: string;
    pdfFileName: string;
    loading: string;
    onError(): void;
    onLoad(): void;
    onProgress(): void;
    goPrevious(): void;
    goNext(): void;
    zoomIn(): void;
    zoomOut(): void;
}

class PdfVisualizationController {

    constructor(private $scope: PdfScope) {
        // the pdf library assumes these are in $scope
        this.$scope.pdfUrl = this.src;
        this.$scope.pdfFileName = 'PDF file';//name of the pdf result file to view
        this.$scope.loading = 'loading';

        this.$scope.onError = this.onError.bind(this);
        this.$scope.onLoad = this.onLoad.bind(this);
        this.$scope.onProgress = this.onProgress.bind(this);
    }

    src: string;

    getNavStyle(scroll: number){
        if(scroll > 100) {
            return 'pdf-controls fixed';
        } else {
            return 'pdf-controls';
        }
    }

    onError(error: any) {
        console.log('pdf error', error);
    }

    onLoad() {
        this.$scope.loading = '';
    }

    onProgress(progress: number) {
    }

    goPrevious() {
        this.$scope.goPrevious();
    }

    goNext() {
        this.$scope.goNext();
    }

    zoomIn() {
        this.$scope.zoomIn();
    }

    zoomOut() {
        this.$scope.zoomOut();
    }
}

export default {
    controller: PdfVisualizationController,
    template: '<ng-pdf template-url="app/views/sessions/session/visualization/pdf/viewer.html" scale="page-fit"></ng-pdf>',
    bindings: {
        src: '='
    }
}