import FileResource from "../../../../../resources/fileresource";

class TextVisualizationController {

    static $inject = ['FileResource', '$scope'];

    sessionId: string;
    datasetId: string;
    data: string;

    constructor(private fileResource: FileResource, private $scope: ng.IScope) {
    }

    $onInit() {
        this.fileResource.getData(this.sessionId, this.datasetId).then( (resp: any) => {
            this.data = resp.data;
        });
    }

}

export default {
    controller: TextVisualizationController,
    template: '<p>{{$ctrl.data}}</p>',
    bindings: {
        datasetId: '<',
        sessionId: '<'
    }
}
