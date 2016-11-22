"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var core_1 = require("@angular/core");
var TSVReader_1 = require("../../../../../services/TSVReader");
var d3 = require("d3");
var _ = require("lodash");
var Rx_1 = require("rxjs/Rx");
var TSVFile_1 = require("../../../../../model/tsv/TSVFile");
var point_1 = require("../model/point");
var venndiagram_service_1 = require("./venndiagram.service");
var venndiagramutils_1 = require("./venndiagramutils");
var utils_service_1 = require("../../../../../services/utils.service");
var venncircle_1 = require("./venncircle");
var sessiondata_service_1 = require("../../sessiondata.service");
var venndiagramselection_1 = require("./venndiagramselection");
var venndiagramtext_1 = require("./venndiagramtext");
var circle_1 = require("../model/circle");
var VennDiagram = (function () {
    function VennDiagram(tsvReader, venndiagramService, $routeParams, sessionDataService) {
        this.tsvReader = tsvReader;
        this.venndiagramService = venndiagramService;
        this.$routeParams = $routeParams;
        this.sessionDataService = sessionDataService;
        this.files = [];
        this.diagramSelection = new venndiagramselection_1.default();
    }
    VennDiagram.prototype.ngOnInit = function () {
        var _this = this;
        var datasetIds = this.selectedDatasets.map(function (dataset) { return dataset.datasetId; });
        var tsvObservables = datasetIds.map(function (datasetId) { return _this.tsvReader.getTSV(_this.$routeParams['sessionId'], datasetId); });
        Rx_1.Observable.forkJoin(tsvObservables).subscribe(function (resultTSVs) {
            _this.files = _.chain(resultTSVs)
                .map(function (tsv) { return d3.tsv.parseRows(tsv.data); })
                .map(function (tsv, index) { return new TSVFile_1.default(tsv, _this.selectedDatasets[index].datasetId, _this.selectedDatasets[index].name); })
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
            center: new point_1.default(size.width / 2, (size.height) / 2)
        };
        this.vennCircles = this.createVennCircles(files, visualizationArea.center, circleRadius);
        // color category
        var colors = d3.scale.category10();
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
            var isShift = utils_service_1.default.isShiftKey(d3.event);
            if (!isShift) {
                selectionGroup.selectAll('*').remove();
            }
            var coords = d3.mouse(document.getElementById('circleGroup'));
            var mouseposition = new point_1.default(coords[0], coords[1]);
            var selectionVennCircles = venndiagramutils_1.default.getCirclesByPosition(_this.vennCircles, mouseposition);
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
        return vennCircles.map(function (vennCircle) { return new venndiagramtext_1.default(vennCircle.filename, _this.venndiagramService.getVennCircleFilenamePoint(vennCircle, visualizationArea.center)); });
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
        var tsvData = d3.tsv.formatRows(data);
        this.sessionDataService.createDerivedDataset("dataset.tsv", parentDatasetIds, "Venn-Diagram", tsvData);
    };
    VennDiagram.prototype.createVennCircles = function (files, visualizationAreaCenter, radius) {
        var circleCenters = this.venndiagramService.getCircleCenterPoints(files.length, visualizationAreaCenter, radius);
        return files.map(function (file, index) { return new venncircle_1.default(file.datasetId, file.filename, file.getColumnDataByHeaderKeys(['symbol', 'identifier']), new circle_1.default(circleCenters[index], radius)); });
    };
    VennDiagram.prototype.enableComparing = function (key) {
        return _.every(this.files, function (file) { return _.includes(file.headers.headers, key); });
    };
    VennDiagram.prototype.compareIntersectionBy = function (str) {
        this.columnKey = str;
        this.resetSelection();
    };
    return VennDiagram;
}());
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], VennDiagram.prototype, "selectedDatasets", void 0);
VennDiagram = __decorate([
    core_1.Component({
        selector: 'vennDiagram',
        templateUrl: 'app/views/sessions/session/visualization/venndiagram/venndiagram.html'
    }),
    __param(2, core_1.Inject('$routeParams')),
    __param(3, core_1.Inject('SessionDataService')),
    __metadata("design:paramtypes", [TSVReader_1.TSVReader,
        venndiagram_service_1.default, Object, sessiondata_service_1.default])
], VennDiagram);
exports.VennDiagram = VennDiagram;
//# sourceMappingURL=venndiagram.js.map