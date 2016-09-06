class HtmlVisualizationController {

    static $inject = ['$sce', '$scope', '$log'];

    constructor(private $sce: any, private $scope: ng.IScope, private $log: ng.ILogService){
    }

    src: string;

    getUrl() {
        return this.$sce.trustAsResourceUrl(this.src + '&download=false&type=true');
    }
}

export default {
    controller: HtmlVisualizationController,
    template: '<iframe frameBorder="0" sandbox="" width="100%" height="100%" ng-src="{{$ctrl.getUrl()}}"></iframe>',
    bindings: {
        src: '='
    }
}
