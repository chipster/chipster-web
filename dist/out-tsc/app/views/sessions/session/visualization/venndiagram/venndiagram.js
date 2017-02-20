var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input } from '@angular/core';
import { TSVReader } from "../../../../../shared/services/TSVReader";
import * as d3 from "d3";
import * as _ from "lodash";
import { Observable } from "rxjs/Rx";
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
export var VennDiagram = (function () {
    function VennDiagram(tsvReader, venndiagramService, sessionDataService) {
        this.tsvReader = tsvReader;
        this.venndiagramService = venndiagramService;
        this.sessionDataService = sessionDataService;
        this.files = [];
        this.diagramSelection = new VennDiagramSelection();
    }
    VennDiagram.prototype.ngOnInit = function () {
        var _this = this;
        var datasetIds = this.selectedDatasets.map(function (dataset) { return dataset.datasetId; });
        var tsvObservables = datasetIds.map(function (datasetId) { return _this.tsvReader.getTSV(_this.sessionDataService.getSessionId(), datasetId); });
        Observable.forkJoin(tsvObservables).subscribe(function (resultTSVs) {
            _this.files = _.chain(resultTSVs)
                .map(function (tsv) { return d3.tsvParseRows(tsv); })
                .map(function (tsv, index) { return new TSVFile(tsv, _this.selectedDatasets[index].datasetId, _this.selectedDatasets[index].name); })
                .value();
            _this.symbolComparingEnabled = _this.enableComparing('symbol');
            _this.identifierComparingEnabled = _this.enableComparing('identifier');
            _this.columnKey = _this.identifierComparingEnabled ? 'identifier' : 'symbol';
            _this.drawVennDiagram(_this.files);
        }, function (error) {
            console.error('Fetching TSV-files failed', error);
        });
    };
    VennDiagram.prototype.drawVennDiagram = function (files) {
        var _this = this;
        var visualizationWidth = document.getElementById('visualization').offsetWidth;
        var circleRadius = 125;
        var size = { width: visualizationWidth, height: 400 };
        var visualizationArea = {
            width: size.width,
            height: size.height,
            center: new Point(size.width / 2, (size.height) / 2)
        };
        this.vennCircles = this.createVennCircles(files, visualizationArea.center, circleRadius);
        // color category
        var colors = d3.scaleOrdinal(d3.schemeCategory10);
        // svg-element
        var svg = d3.select('#visualization')
            .append('svg')
            .attr('width', size.width)
            .attr('height', size.height)
            .attr('id', 'svg');
        // draw vennCircles
        var circleGroup = svg.append('g').attr('id', 'circleGroup');
        circleGroup.selectAll('.ellipse')
            .data(this.vennCircles)
            .enter()
            .append('ellipse')
            .attr('rx', function (d, i) { return d.circle.radius; })
            .attr('ry', function (d, i) { return d.circle.radius; })
            .attr('cx', function (d, i) { return d.circle.center.x; })
            .attr('cy', function (d, i) { return d.circle.center.y; })
            .attr('opacity', 0.4)
            .attr('fill', function (d, i) { return colors(i.toString()); });
        // Add filenames for each venn diagram circles and item counts in each segment
        var circleTextsGroup = svg.append('g').attr('id', 'circleTextsGroup');
        var filenameTexts = this.getVennCircleFileNameDescriptor(this.vennCircles, visualizationArea);
        var segmentItemCountTexts = this.venndiagramService.getVennDiagramSegmentTexts(this.vennCircles, visualizationArea.center, this.columnKey);
        var circleTexts = filenameTexts.concat(segmentItemCountTexts);
        circleTextsGroup.selectAll('.text')
            .data(circleTexts)
            .enter()
            .append('text')
            .attr('x', function (d) { return d.position.x; })
            .attr('y', function (d) { return d.position.y; })
            .text(function (d) { return d.text; });
        // selection group
        var selectionGroup = svg.append('g').attr('id', 'vennselections');
        circleGroup.on('click', function () {
            var isShift = UtilsService.isShiftKey(d3.event);
            if (!isShift) {
                selectionGroup.selectAll('*').remove();
            }
            var coords = d3.mouse(document.getElementById('circleGroup'));
            var mouseposition = new Point(coords[0], coords[1]);
            var selectionVennCircles = VennDiagramUtils.getCirclesByPosition(_this.vennCircles, mouseposition);
            if (selectionVennCircles.length >= 1) {
                var selectionDescriptor = _this.getSelectionDescriptor(_this.vennCircles, selectionVennCircles, circleRadius, visualizationArea);
                selectionGroup.append("path")
                    .attr('class', 'vennselection')
                    .attr("d", selectionDescriptor)
                    .attr('fill', 'grey')
                    .attr('opacity', 0.7)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1);
                var values = _this.venndiagramService.getDataIntersection(selectionVennCircles, _this.vennCircles, _this.columnKey);
                var datasetIds = selectionVennCircles.map(function (vennCircle) { return vennCircle.datasetId; });
                if (!isShift) {
                    _this.diagramSelection.clearSelection();
                }
                _this.diagramSelection.addSelection(datasetIds, values);
            }
        });
    };
    VennDiagram.prototype.getVennCircleFileNameDescriptor = function (vennCircles, visualizationArea) {
        var _this = this;
        return vennCircles.map(function (vennCircle) { return new VennDiagramText(vennCircle.filename, _this.venndiagramService.getVennCircleFilenamePoint(vennCircle, visualizationArea.center)); });
    };
    VennDiagram.prototype.getSelectionDescriptor = function (allVennCircles, selectionVennCircles, circleRadius, visualizationArea) {
        var selectionCircles = selectionVennCircles.map(function (vennCircle) { return vennCircle.circle; });
        var circles = allVennCircles.map(function (vennCircle) { return vennCircle.circle; });
        return this.venndiagramService.getSelectionDescriptor(circles, selectionCircles, circleRadius, visualizationArea.center);
    };
    VennDiagram.prototype.resetSelection = function () {
        this.diagramSelection.clearSelection();
    };
    VennDiagram.prototype.createNewDataset = function () {
        var parentDatasetIds = this.selectedDatasets.map(function (dataset) { return dataset.datasetId; });
        var data = this.venndiagramService.generateNewDatasetTSV(this.files, this.diagramSelection, this.columnKey);
        var tsvData = d3.tsvFormatRows(data);
        this.sessionDataService.createDerivedDataset("dataset.tsv", parentDatasetIds, "Venn-Diagram", tsvData).subscribe();
    };
    VennDiagram.prototype.createVennCircles = function (files, visualizationAreaCenter, radius) {
        var circleCenters = this.venndiagramService.getCircleCenterPoints(files.length, visualizationAreaCenter, radius);
        return files.map(function (file, index) { return new VennCircle(file.datasetId, file.filename, file.getColumnDataByHeaderKeys(['symbol', 'identifier']), new Circle(circleCenters[index], radius)); });
    };
    VennDiagram.prototype.enableComparing = function (key) {
        return _.every(this.files, function (file) { return _.includes(file.headers.headers, key); });
    };
    VennDiagram.prototype.compareIntersectionBy = function (str) {
        this.columnKey = str;
        this.resetSelection();
    };
    __decorate([
        Input(), 
        __metadata('design:type', Array)
    ], VennDiagram.prototype, "selectedDatasets", void 0);
    VennDiagram = __decorate([
        Component({
            selector: 'ch-venn-diagram',
            templateUrl: './venndiagram.html'
        }), 
        __metadata('design:paramtypes', [TSVReader, VennDiagramService, SessionDataService])
    ], VennDiagram);
    return VennDiagram;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/venndiagram/venndiagram.js.map