import SessionDataService from "../../sessiondata.service";
import {TSVReader} from "../../../../../services/TSVReader";
import * as d3 from "d3";
import {Input, Component, Inject} from "@angular/core";
import TSVFile from "../../../../../model/tsv/TSVFile";

@Component({
  selector: 'ch-spreadsheet-visualization',
  template: '<div id="tableContainer"></div>'
})
export class SpreadsheetVisualizationComponent {

    @Input() datasetId: string;

    constructor(@Inject('SessionDataService') private sessionDataService: SessionDataService,
                private tsvReader: TSVReader){}

    ngOnInit() {
        this.tsvReader.getTSV(this.sessionDataService.getSessionId(), this.datasetId).subscribe( (result: any) => {
            let parsedTSV = d3.tsvParseRows(result.data);
            let normalizedTSV = new TSVFile(parsedTSV, this.datasetId, 'öalskfj');
            const container = document.getElementById('tableContainer');
            new Handsontable(container, this.getSettings(normalizedTSV.getRawData()));
        }, e => console.error('Fetching TSVData failed', e));

    }

    getSettings(array: string[][]) {
      const arrayHeight = array.length * 23 + 23; // extra for header-row
        return {
            data: array.slice(1),
            colHeaders: array[0],
            columnSorting: true,
            manualColumnResize: true,
            sortIndicator: true,
            readOnly: true,
            rowHeights: 23,
            height: arrayHeight,
            renderAllRows: false
        }
    }
}
