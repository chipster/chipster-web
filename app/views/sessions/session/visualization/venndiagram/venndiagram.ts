import {Component, Input, Inject} from '@angular/core';
import {TSVReader} from "../../../../../services/TSVReader";
import TSVFile from "../expressionprofile/tsv/TSVFile";
import Dataset from "../../../../../model/session/dataset";
import * as d3 from "d3";
import * as _ from "lodash";
import {Observable} from "rxjs/Rx";
import TSVFile from "../expressionprofile/tsv/TSVFile";

@Component({
    selector: 'vennDiagram',
    templateUrl: 'app/views/sessions/session/visualization/venndiagram/venndiagram.html'
})
export class VennDiagram {

    @Input() selectedDatasets: Array<any>;

    files: Array<TSVFile> = [];

    constructor(private tsvReader: TSVReader, @Inject('$routeParams') private $routeParams: ng.route.IRouteParamsService) {
    }

    ngOnInit() {

        const tsvObservables = _.chain(this.selectedDatasets)
            .map((dataset: Dataset) => dataset.datasetId )
            .map( (datasetId: string) => this.tsvReader.getTSV(this.$routeParams['sessionId'], datasetId))
            .value();

        Observable.forkJoin(tsvObservables).subscribe( (resultTSVs: Array<any>) => {
            this.files = _.chain(resultTSVs)
                .map( (tsv: any) => d3.tsv.parseRows(tsv.data))
                .map( (tsv: Array<Array<string>>) => new TSVFile(tsv))
                .value();

                this.drawVennDiagram(this.files);
        });


    }

    drawVennDiagram(files: Array<TSVFile>) {

    }

    

}