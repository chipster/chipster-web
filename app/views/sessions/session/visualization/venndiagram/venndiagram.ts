import {Component, Input, Inject} from '@angular/core';
import {TSVReader} from "../../../../../services/TSVReader";
import Dataset from "../../../../../model/session/dataset";
import * as d3 from "d3";
import * as _ from "lodash";
import {Observable} from "rxjs/Rx";
import TSVFile from "../../../../../model/tsv/TSVFile";
import TSVColumn from "../../../../../model/tsv/TSVColumn";
import Point from "../model/point";
import VennDiagramService from "./venndiagram.service";
import Circle from "./circle";
import VennDiagramUtils from "./venndiagramutils";
import UtilsService from "../../../../../services/utils.service";

@Component({
    selector: 'vennDiagram',
    templateUrl: 'app/views/sessions/session/visualization/venndiagram/venndiagram.html'
})
export class VennDiagram {

    @Input()
    selectedDatasets: Array<any>;
    files: Array<TSVFile> = [];
    circles: Array<Circle>;

    constructor(private tsvReader: TSVReader,
                private venndiagramService: VennDiagramService,
                @Inject('$routeParams') private $routeParams: ng.route.IRouteParamsService) {
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
        let visualizationWidth = document.getElementById('visualization').offsetWidth;
        let circleRadius = 125;
        let size = { width: visualizationWidth, height: 400 };
        let visualizationArea = {
            width: size.width,
            height: size.height,
            center: new Point(size.width / 2, (size.height) / 2)
        };
        let ellipseDatas = _.map(files ,(file:TSVFile) => new TSVColumn(file, 'symbol').getDataAsSet() );
        this.circles = this.venndiagramService.createCircles(ellipseDatas, visualizationArea.center, circleRadius);

        // color category
        const colors = d3.scale.category10();

        // svg-element
        let svg = d3.select('#visualization')
            .append('svg')
            .attr('width', size.width)
            .attr('height', size.height)
            .attr('id', 'svg');

        // draw circles
        let circleGroup = svg.append('g').attr('id', 'circleGroup');
        circleGroup.selectAll('.ellipse')
            .data(this.circles)
            .enter()
            .append('ellipse')
            .attr('rx', (d:Circle, i: number) => this.circles[i].radius)
            .attr('ry', (d:Circle, i: number) => this.circles[i].radius)
            .attr('cx', (d:Circle, i: number) => this.circles[i].center.x )
            .attr('cy', (d:Circle, i: number) => this.circles[i].center.y )
            .attr('opacity', 0.4)
            .attr('fill', (d: Circle, i: number) => colors(i.toString()));

        // selection group
        let selectionGroup = svg.append('g').attr('id', 'vennselections');
        circleGroup.on('click', () => {

            if(!UtilsService.isShiftKey(d3.event)) {
                selectionGroup.selectAll('*').remove();
            }

            let coords = d3.mouse(document.getElementById('circleGroup'));
            let mouseposition = new Point(coords[0], coords[1]);
            let selectionCircles = VennDiagramUtils.getCirclesByPosition(this.circles, mouseposition);

            if(selectionCircles.length >= 1) {

                let selectionDescriptor = this.venndiagramService.getSelectionDescriptor(this.circles, selectionCircles, circleRadius, visualizationArea.center);
                selectionGroup.append("path")
                    .attr('class', 'vennselection')
                    .attr("d", selectionDescriptor)
                    .attr('fill', 'black');
            }
        });

    }





}