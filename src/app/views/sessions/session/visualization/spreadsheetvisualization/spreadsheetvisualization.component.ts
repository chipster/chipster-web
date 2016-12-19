import SessionDataService from "../../sessiondata.service";
import {TSVReader} from "../../../../../services/TSVReader";
import * as d3 from "d3";

class SpreadsheetVisualizationController {

    static $inject = ['SessionDataService', 'TSVReader'];

    datasetId: string;

    constructor(private sessionDataService: SessionDataService,
                private tsvReader: TSVReader){}

    $onInit() {
        this.tsvReader.getTSV(this.sessionDataService.getSessionId(), this.datasetId).subscribe( (result: any) => {
            let parsedTSV = d3.tsvParseRows(result.data);
            const container = document.getElementById('tableContainer');
            new Handsontable(container, this.getSettings(parsedTSV));
        }, e => console.error('Fetching TSVData failed', e));

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