import FileResource from "../../../../../resources/fileresource";
import SessionDataService from "../../sessiondata.service";

class TextVisualizationController {

    static $inject = ['FileResource', '$scope', 'SessionDataService'];

    datasetId: string;
    data: string;

    constructor(private fileResource: FileResource, private $scope: ng.IScope, private SessionDataService: SessionDataService) {
    }

    $onInit() {
        this.fileResource.getData(this.SessionDataService.getSessionId(), this.datasetId).then( (resp: any) => {
            this.data = resp.data;
        });
    }

}

export default {
    controller: TextVisualizationController,
    template: '<p>{{$ctrl.data}}</p>',
    bindings: {
        datasetId: '<'
    }
}
