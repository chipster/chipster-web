class HtmlVisualizationController {

    static $inject = ['$sce'];

    constructor(private $sce: any){
    }

    src: string;

    getUrl() {
        return this.$sce.trustAsResourceUrl(this.src + '&download=false&type=true');
    }
}

export default {
    controller: HtmlVisualizationController,
    template: '<iframe frameBorder="0" sandbox="" width="100%" height="1000px" ng-src="{{$ctrl.getUrl()}}"></iframe>',
    bindings: {
        src: '='
    }
}
