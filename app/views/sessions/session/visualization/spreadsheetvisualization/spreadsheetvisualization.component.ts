import FileResource from "../../../../../resources/fileresource";
import SessionDataService from "../../sessiondata.service";

class SpreadsheetVisualizationController {

    static $inject = ['FileResource', '$scope', 'SessionDataService'];

    datasetId: string;

    constructor(private fileResource: FileResource,
                private $scope: ng.IScope,
                private SessionDataService: SessionDataService){

    }

    $onInit() {
        this.fileResource.getData(this.SessionDataService.getSessionId(), this.datasetId).then((resp: any) => {

            // parse the file data using the JQuery-cvs library
            let parserConfig = {
                separator: '\t'
            };

            $['csv'].toArrays(resp.data, parserConfig, (err: any, array: string[][]) => {

                var container = document.getElementById('tableContainer');

                new Handsontable(container, this.getSettings(array));
            });
        });
    }

    getSettings(array: string[][]) {
        return {
            data: array.slice(1),
            colHeaders: array[0],
            columnSorting: true,
            manualColumnResize: true,
            sortIndicator: true,
            readOnly: true
        }
    }
}

export default {
    controller: SpreadsheetVisualizationController,
    template: '<div id="tableContainer"></div>',
    bindings: {
        datasetId: '<'
    }
}