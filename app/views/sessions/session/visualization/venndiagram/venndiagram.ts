import {Component, Input, Inject} from '@angular/core';
import {TSVReader} from "../../../../../services/TSVReader";
import Dataset from "../../../../../model/session/dataset";
import * as d3 from "d3";
import * as _ from "lodash";
import {Observable} from "rxjs/Rx";
import TSVFile from "../../../../../model/tsv/TSVFile";
import Point from "../model/point";
import VennDiagramService from "./venndiagram.service";
import VennDiagramUtils from "./venndiagramutils";
import UtilsService from "../../../../../services/utils.service";
import VennCircle from "./venncircle";
import SessionDataService from "../../sessiondata.service";
import VennDiagramSelection from "./venndiagramselection";

@Component({
    selector: 'vennDiagram',
    templateUrl: 'app/views/sessions/session/visualization/venndiagram/venndiagram.html'
})
export class VennDiagram {

    @Input()
    selectedDatasets: Array<any>;

    files: Array<TSVFile> = [];
    vennCircles: Array<VennCircle>;
    diagramSelection: VennDiagramSelection = new VennDiagramSelection();

    constructor(private tsvReader: TSVReader,
                private venndiagramService: VennDiagramService,
                @Inject('$routeParams') private $routeParams: ng.route.IRouteParamsService,
                @Inject('SessionDataService') private sessionDataService: SessionDataService) {
    }

    ngOnInit() {

        const datasetIds = this.selectedDatasets.map( (dataset: Dataset) => dataset.datasetId);
        const tsvObservables = datasetIds.map( (datasetId: string) => this.tsvReader.getTSV(this.$routeParams['sessionId'], datasetId));

        Observable.forkJoin(tsvObservables).subscribe( (resultTSVs: Array<any>) => {
            this.files = _.chain(resultTSVs)
                .map( (tsv: any) => d3.tsv.parseRows(tsv.data))
                .map( (tsv: Array<Array<string>>, index: number) => new TSVFile(tsv, datasetIds[index]))
                .value();
            console.log(this.files);
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

        this.vennCircles = this.createVennCircles(files, visualizationArea.center, circleRadius);

        // color category
        const colors = d3.scale.category10();

        // svg-element
        let svg = d3.select('#visualization')
            .append('svg')
            .attr('width', size.width)
            .attr('height', size.height)
            .attr('id', 'svg');

        // draw vennCircles
        let circleGroup = svg.append('g').attr('id', 'circleGroup');
        circleGroup.selectAll('.ellipse')
            .data(this.vennCircles)
            .enter()
            .append('ellipse')
            .attr('rx', (d:VennCircle, i: number) => d.circle.radius )
            .attr('ry', (d:VennCircle, i: number) => d.circle.radius )
            .attr('cx', (d:VennCircle, i: number) => d.circle.center.x )
            .attr('cy', (d:VennCircle, i: number) => d.circle.center.y )
            .attr('opacity', 0.4)
            .attr('fill', (d: VennCircle, i: number) => colors(i.toString()));

        // svg.on('click', this.resetSelection);

        // selection group
        let selectionGroup = svg.append('g').attr('id', 'vennselections');
        circleGroup.on('click', () => {

            let isShift = UtilsService.isShiftKey(d3.event);
            if(!isShift) {
                selectionGroup.selectAll('*').remove();
            }

            let coords = d3.mouse(document.getElementById('circleGroup'));
            let mouseposition = new Point(coords[0], coords[1]);
            let selectionVennCircles = VennDiagramUtils.getCirclesByPosition(this.vennCircles, mouseposition);

            if(selectionVennCircles.length >= 1) {

                let selectionCircles = selectionVennCircles.map( (vennCircle: VennCircle) => vennCircle.circle);
                let circles = this.vennCircles.map( (vennCircle: VennCircle) => vennCircle.circle );
                let selectionDescriptor = this.venndiagramService.getSelectionDescriptor(circles, selectionCircles, circleRadius, visualizationArea.center);
                selectionGroup.append("path")
                    .attr('class', 'vennselection')
                    .attr("d", selectionDescriptor)
                    .attr('fill', 'grey')
                    .attr('opacity', 0.7)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1);

                let values = this.venndiagramService.getDataIntersection(selectionVennCircles);
                let datasetIds = selectionVennCircles.map( (vennCircle: VennCircle) => vennCircle.datasetId);
                this.diagramSelection.addSelection(datasetIds, values);
            }
        });

    }

    resetSelection(): void {
        this.diagramSelection.clearSelection();
    }

    createNewDataset(): void {
        let parentDatasetIds = this.selectedDatasets.map( (dataset: Dataset) => dataset.datasetId );
        let data = this.venndiagramService.generateNewDatasetTSV(this.files, this.diagramSelection, 'symbol');
        this.sessionDataService.createDerivedDataset("dataset.tsv", parentDatasetIds, "Venn-Diagram", data);
    }

    createVennCircles(files: Array<TSVFile>, visualizationAreaCenter: Point, radius: number): Array<VennCircle> {
        const circleCenters = this.venndiagramService.getCircleCenterPoints(files.length, visualizationAreaCenter, radius);
        return _.map(files ,(file:TSVFile, index: number) => new VennCircle(file.datasetId, file.getColumnDataByHeaderKey('symbol'), circleCenters[index], radius));
    }

}