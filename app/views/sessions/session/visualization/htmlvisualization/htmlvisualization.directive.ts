class HtmlVisualizationController {

    static $inject = ['$sce', '$scope'];

    constructor(private $sce: any, private $scope: ng.IScope){
    }

    src: string;

    getUrl() {
        console.log('getUrl()', this.$sce.trustAsResourceUrl(this.src + '&download=false&type=true'));
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
