import {Component, Input} from '@angular/core';
import {TSVReader} from "../../../../../shared/services/TSVReader";
import Dataset from "../../../../../model/session/dataset";
import * as d3 from "d3";
import * as _ from "lodash";
import {Observable} from "rxjs/Rx";
import TSVFile from "../../../../../model/tsv/TSVFile";
import Point from "../model/point";
import VennDiagramService from "./venndiagram.service";
import VennDiagramUtils from "./venndiagramutils";
import UtilsService from "../../../../../shared/utilities/utils";
import VennCircle from "./venncircle";
import SessionDataService from "../../sessiondata.service";
import VennDiagramSelection from "./venndiagramselection";
import VennDiagramText from "./venndiagramtext";
import Circle from "../model/circle";

@Component({
    selector: 'ch-venn-diagram',
    templateUrl: './venndiagram.html'
})
export class VennDiagram {

    @Input()
    selectedDatasets: Array<any>;

    files: Array<TSVFile> = [];
    vennCircles: Array<VennCircle>;
    diagramSelection: VennDiagramSelection = new VennDiagramSelection();
    columnKey: string;
    symbolComparingEnabled: boolean;
    identifierComparingEnabled: boolean;

    constructor(private tsvReader: TSVReader,
                private venndiagramService: VennDiagramService,
                private sessionDataService: SessionDataService) {
    }

    ngOnInit() {
        const datasetIds = this.selectedDatasets.map( (dataset: Dataset) => dataset.datasetId);
        const tsvObservables = datasetIds.map( (datasetId: string) => this.tsvReader.getTSV(this.sessionDataService.getSessionId(), datasetId));

        Observable.forkJoin(tsvObservables).subscribe( (resultTSVs: Array<any>) => {
            this.files = _.chain(resultTSVs)
                .map( (tsv: any) => d3.tsvParseRows(tsv))
                .map( (tsv: Array<Array<string>>, index: number) => new TSVFile(tsv, this.selectedDatasets[index].datasetId, this.selectedDatasets[index].name))
                .value();

            this.symbolComparingEnabled = this.enableComparing('symbol');
            this.identifierComparingEnabled = this.enableComparing('identifier');
            this.columnKey = this.identifierComparingEnabled ? 'identifier' : 'symbol';
            this.drawVennDiagram(this.files);
        }, (error: any) => {
            console.error('Fetching TSV-files failed', error);
        })
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
        const colors = d3.scaleOrdinal(d3.schemeCategory10);

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

        // Add filenames for each venn diagram circles and item counts in each segment
        let circleTextsGroup = svg.append('g').attr('id', 'circleTextsGroup');
        let filenameTexts = this.getVennCircleFileNameDescriptor(this.vennCircles, visualizationArea);
        let segmentItemCountTexts = this.venndiagramService.getVennDiagramSegmentTexts(this.vennCircles, visualizationArea.center, this.columnKey);

        let circleTexts = [...filenameTexts, ...segmentItemCountTexts];
        circleTextsGroup.selectAll('.text')
            .data(circleTexts)
            .enter()
            .append('text')
            .attr('x', (d) => d.position.x)
            .attr('y', (d) => d.position.y)
            .text( (d) => d.text);

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

                const selectionDescriptor = this.getSelectionDescriptor( this.vennCircles, selectionVennCircles, circleRadius, visualizationArea);

                selectionGroup.append("path")
                    .attr('class', 'vennselection')
                    .attr("d", selectionDescriptor)
                    .attr('fill', 'grey')
                    .attr('opacity', 0.7)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1);

                let values = this.venndiagramService.getDataIntersection(selectionVennCircles, this.vennCircles, this.columnKey);
                let datasetIds = selectionVennCircles.map( (vennCircle: VennCircle) => vennCircle.datasetId);
                if(!isShift) {
                    this.diagramSelection.clearSelection();
                }
                this.diagramSelection.addSelection(datasetIds, values);
            }
        });
    }

    getVennCircleFileNameDescriptor(vennCircles: Array<VennCircle>, visualizationArea: any): Array<any> {
        return vennCircles.map( (vennCircle: VennCircle) => new VennDiagramText(vennCircle.filename, this.venndiagramService.getVennCircleFilenamePoint(vennCircle, visualizationArea.center)) );
    }

    getSelectionDescriptor(allVennCircles: Array<VennCircle>, selectionVennCircles: Array<VennCircle>, circleRadius, visualizationArea) {
        let selectionCircles = selectionVennCircles.map( (vennCircle: VennCircle) => vennCircle.circle);
        let circles = allVennCircles.map( (vennCircle: VennCircle) => vennCircle.circle );
        return this.venndiagramService.getSelectionDescriptor(circles, selectionCircles, circleRadius, visualizationArea.center);
    }

    resetSelection(): void {
        this.diagramSelection.clearSelection();
    }

    createNewDataset(): void {
        let parentDatasetIds = this.selectedDatasets.map( (dataset: Dataset) => dataset.datasetId );
        let data = this.venndiagramService.generateNewDatasetTSV(this.files, this.diagramSelection, this.columnKey);
        let tsvData = d3.tsvFormatRows(data);
        this.sessionDataService.createDerivedDataset("dataset.tsv", parentDatasetIds, "Venn-Diagram", tsvData).subscribe();
    }

    createVennCircles(files: Array<TSVFile>, visualizationAreaCenter: Point, radius: number): Array<VennCircle> {
        const circleCenters = this.venndiagramService.getCircleCenterPoints(files.length, visualizationAreaCenter, radius);
        return files.map( (file:TSVFile, index: number) => new VennCircle(file.datasetId,
                                                                            file.filename,
                                                                            file.getColumnDataByHeaderKeys(['symbol', 'identifier']),
                                                                            new Circle( circleCenters[index], radius)));
    }

    enableComparing(key: string): boolean {
        return _.every(this.files, (file: TSVFile) => _.includes(file.headers.headers, key) );
    }

    compareIntersectionBy(str: string): void {
        this.columnKey = str;
        this.resetSelection();
    }



}
