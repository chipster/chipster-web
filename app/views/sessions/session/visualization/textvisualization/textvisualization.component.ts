import FileResource from "../../../../../resources/fileresource";

class TextVisualizationController {

    static $inject = ['FileResource', '$scope'];

    constructor(private fileResource: FileResource, private $scope: ng.IScope) {
        this.init();
    }

    sessionId: string;
    datasetId: string;
    data: string;

    init() {
        this.fileResource.getData(this.sessionId, this.datasetId).then(function (resp: any) {
            this.data = resp.data;
        });
    }
}

export default {
    controller: TextVisualizationController,
    template: '<p>{{$ctrl.data}}</p>',
    bindings: {
        datasetId: '=',
        sessionId: '='
    }
}
