var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import ExpressionProfileService from "./expressionprofile.service";
import Point from "../model/point";
import Rectangle from "./rectangle";
import Interval from "./interval";
import SessionDataService from "../../sessiondata.service";
import UtilsService from "../../../../../shared/utilities/utils";
import TSVFile from "../../../../../model/tsv/TSVFile";
import { TSVReader } from "../../../../../shared/services/TSVReader";
import { ExpressionProfileTSVService } from "./expressionprofileTSV.service";
import * as d3 from "d3";
import * as _ from "lodash";
import { Component, Input } from "@angular/core";
import FileResource from "../../../../../shared/resources/fileresource";
export var ExpressionProfileComponent = (function () {
    function ExpressionProfileComponent(tsvReader, expressionProfileService, sessionDataService, expressionProfileTSVService, fileResource) {
        this.tsvReader = tsvReader;
        this.expressionProfileService = expressionProfileService;
        this.sessionDataService = sessionDataService;
        this.expressionProfileTSVService = expressionProfileTSVService;
        this.fileResource = fileResource;
    }
    ExpressionProfileComponent.prototype.ngOnInit = function () {
        var _this = this;
        var datasetName = this.selectedDatasets[0].name;
        this.fileResource.getData(this.sessionDataService.getSessionId(), this.datasetId).subscribe(function (result) {
            var parsedTSV = d3.tsvParseRows(result);
            _this.tsv = new TSVFile(parsedTSV, _this.datasetId, datasetName);
            _this.drawLineChart(_this.tsv);
        });
        this.selectedGeneExpressions = [];
    };
    ExpressionProfileComponent.prototype.drawLineChart = function (tsv) {
        var _this = this;
        var that = this;
        // Configurate svg and graph-area
        var expressionprofileWidth = document.getElementById('expressionprofile').offsetWidth;
        var margin = { top: 10, right: 0, bottom: 150, left: 40 };
        var size = { width: expressionprofileWidth, height: 600 };
        var graphArea = {
            width: size.width,
            height: size.height - margin.top - margin.bottom
        };
        // SVG-element
        var drag = d3.drag();
        var svg = d3.select('#expressionprofile')
            .append('svg')
            .attr('width', size.width)
            .attr('height', size.height)
            .attr('id', 'svg')
            .style('margin-top', margin.top + 'px')
            .call(drag);
        // Custom headers for x-axis
        var firstDataset = _.first(this.selectedDatasets);
        var phenodataDescriptions = _.filter(firstDataset.metadata, function (metadata) {
            return metadata.key === 'description';
        });
        // Change default headers to values defined in phenodata if description value has been defined
        var headers = _.map(this.expressionProfileTSVService.getChipHeaders(tsv), function (header) {
            // find if there is a phenodata description matching header and containing a value
            var phenodataHeader = _.find(phenodataDescriptions, function (item) {
                return item.column === header && item.value !== null;
            });
            return phenodataHeader ? phenodataHeader.value : header;
        });
        // X-axis and scale
        // Calculate points (in pixels) for positioning x-axis points
        var chipRange = _.map(headers, function (item, index) { return (graphArea.width / headers.length) * index; });
        var xScale = d3.scaleOrdinal().range(chipRange).domain(headers);
        //compile error hidden with <any>: Argument of type 'ScaleOrdinal<string, {}>' is not assignable to parameter of type 'AxisScale<string>'.
        var xAxis = d3.axisBottom(xScale).ticks(headers.length);
        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(' + margin.left + ',' + graphArea.height + ')')
            .call(xAxis)
            .selectAll("text")
            .attr('transform', 'rotate(-65 0 0)')
            .style('text-anchor', 'end');
        // Linear x-axis to determine selection-rectangle position scaled to tsv-data
        var linearXScale = d3.scaleLinear().range([0, graphArea.width - (graphArea.width / headers.length)]).domain([0, headers.length - 1]);
        // Y-axis and scale
        var yScale = d3.scaleLinear()
            .range([graphArea.height, 0])
            .domain([this.expressionProfileTSVService.getDomainBoundaries(tsv).min, this.expressionProfileTSVService.getDomainBoundaries(tsv).max]);
        var yAxis = d3.axisLeft(yScale).ticks(5);
        svg.append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate(' + margin.left + ',0 )')
            .call(yAxis);
        // Paths
        var pathsGroup = svg.append("g").attr('id', 'pathsGroup').attr('transform', 'translate(' + margin.left + ',0)');
        var lineGenerator = d3.line()
            .x(function (d, i) { return parseFloat(xScale(headers[i]).toString()); })
            .y(function (d) { return yScale(d); });
        var color = d3.scaleOrdinal(d3.schemeCategory20);
        var geneExpressions = this.expressionProfileTSVService.getGeneExpressions(tsv);
        var orderedExpressionGenes = this.expressionProfileTSVService.orderBodyByFirstValue(geneExpressions);
        var paths = pathsGroup.selectAll('.path')
            .data(orderedExpressionGenes)
            .enter()
            .append('path')
            .attr('class', 'path')
            .attr('id', function (d) { return 'path' + d.id; })
            .attr('d', function (d) { return lineGenerator(d.values); })
            .attr('fill', 'none')
            .attr('stroke-width', 1)
            .attr('stroke', function (d, i) {
            //     There are 20 different colors in colorcategory. Setting same color for each consecutive 5% of lines.
            //     So for 100 lines 5 first lines gets first color in category, next 5 lines get second color and so on.
            var colorIndex = (_.floor((i / tsv.body.size()) * 20)).toString();
            return color(colorIndex);
        })
            .on('mouseover', function (d) {
            that.setSelectionHoverStyle(d.id);
        })
            .on('mouseout', function (d) {
            that.removeSelectionHoverStyle(d.id);
        })
            .on('click', function (d) {
            var id = d.id;
            var isCtrl = UtilsService.isCtrlKey(d3.event);
            var isShift = UtilsService.isShiftKey(d3.event);
            if (isShift) {
                that.addSelections([id]);
            }
            else if (isCtrl) {
                that.toggleSelections([id.toString()]);
            }
            else {
                that.resetSelections();
                that.addSelections([id]);
            }
        });
        // path animation
        // paths.each(function(d: any) { d.totalLength = this.getTotalLength(); })
        //     .attr("stroke-dasharray", function(d:any) { return d.totalLength + " " + d.totalLength; })
        //     .attr("stroke-dashoffset", function(d:any) { return d.totalLength; })
        //     .transition()
        //     .duration(2000)
        //     .ease('linear')
        //     .attr('stroke-dashoffset', 0);
        // Dragging
        var dragGroup = svg.append("g").attr('id', 'dragGroup').attr('transform', 'translate(' + margin.left + ',0)');
        // Create selection rectangle
        var band = dragGroup.append("rect")
            .attr("width", 0)
            .attr("height", 0)
            .attr("x", 0)
            .attr("y", 0)
            .attr("class", "band")
            .attr('id', 'band');
        var bandPos = [-1, -1];
        var startPoint = new Point(-1, -1); // startpoint for dragging
        // Register drag handlers
        drag.on("drag", function () {
            var pos = d3.mouse(document.getElementById('dragGroup'));
            var endPoint = new Point(pos[0], pos[1]);
            if (endPoint.x < startPoint.x) {
                d3.select(".band").attr("transform", "translate(" + (endPoint.x) + "," + startPoint.y + ")");
            }
            if (endPoint.y < startPoint.y) {
                d3.select(".band").attr("transform", "translate(" + (endPoint.x) + "," + endPoint.y + ")");
            }
            if (endPoint.y < startPoint.y && endPoint.x > startPoint.x) {
                d3.select(".band").attr("transform", "translate(" + (startPoint.x) + "," + endPoint.y + ")");
            }
            //set new position of band when user initializes drag
            if (startPoint.x === -1) {
                startPoint = new Point(endPoint.x, endPoint.y);
                d3.select(".band").attr("transform", "translate(" + startPoint.x + "," + startPoint.y + ")");
            }
            d3.select(".band").transition().duration(1)
                .attr("width", Math.abs(startPoint.x - endPoint.x))
                .attr("height", Math.abs(startPoint.y - endPoint.y));
        });
        drag.on("end", function () {
            var pos = d3.mouse(document.getElementById('dragGroup'));
            var endPoint = new Point(pos[0], pos[1]);
            if ((startPoint.x !== -1 && startPoint.y !== -1) && ((startPoint.x !== endPoint.x) && (startPoint.y !== endPoint.y))) {
                _this.resetSelections();
                d3.selectAll('.path').attr('stroke-width', 1);
                var p1 = new Point(endPoint.x, endPoint.y);
                var p2 = new Point(startPoint.x, startPoint.y);
                var intervalIndexes = that.expressionProfileService.getCrossingIntervals(endPoint, startPoint, linearXScale, tsv);
                var intervals = [];
                // create intervals
                for (var chipValueIndex = intervalIndexes.start; chipValueIndex < intervalIndexes.end; chipValueIndex++) {
                    var lines = that.expressionProfileService.createLines(tsv, chipValueIndex, linearXScale, yScale);
                    var intervalStartIndex = chipValueIndex;
                    var rectangle = new Rectangle(endPoint.x, endPoint.y, startPoint.x, startPoint.y);
                    intervals.push(new Interval(intervalStartIndex, lines, rectangle));
                }
                var ids = []; // path ids found in each interval (not unique list)
                var _loop_1 = function(interval) {
                    var intersectingLines = _.filter(interval.lines, function (line) {
                        return that.expressionProfileService.isIntersecting(line, interval.rectangle);
                    });
                    // Line ids intersecting with selection as an array
                    ids = ids.concat(_.map(intersectingLines, function (line) { return line.lineId; }));
                };
                for (var _i = 0, intervals_1 = intervals; _i < intervals_1.length; _i++) {
                    var interval = intervals_1[_i];
                    _loop_1(interval);
                }
                ;
                _this.resetSelections();
                _this.addSelections(_.uniq(ids));
                // remove duplicate ids
                resetSelectionRectangle();
            }
        });
        function resetSelectionRectangle() {
            startPoint = new Point(-1, -1);
            d3.select('.band')
                .attr("width", 0)
                .attr("height", 0)
                .attr("x", 0)
                .attr("y", 0);
        }
    };
    ExpressionProfileComponent.prototype.createNewDataset = function () {
        var selectedGeneExpressionIds = this.getSelectionIds();
        var tsvData = this.tsv.getRawDataByRowIds(selectedGeneExpressionIds);
        var data = d3.tsvFormatRows(tsvData);
        this.sessionDataService.createDerivedDataset("dataset.tsv", [this.datasetId], "Expression profile", data).subscribe();
    };
    ExpressionProfileComponent.prototype.getSelectionIds = function () {
        return this.selectedGeneExpressions.map(function (expression) { return expression.id; });
    };
    ExpressionProfileComponent.prototype.resetSelections = function () {
        this.removeSelections(this.getSelectionIds());
        this.selectedGeneExpressions.length = 0;
    };
    ExpressionProfileComponent.prototype.removeSelections = function (ids) {
        var _this = this;
        for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
            var id = ids_1[_i];
            this.removeSelectionStyle(id);
        }
        var selectedGeneIds = _.filter(this.getSelectionIds(), function (selectionId) { return !_.includes(ids, selectionId); });
        this.selectedGeneExpressions = _.map(selectedGeneIds, function (id) { return _this.expressionProfileTSVService.getGeneExpression(_this.tsv, id); });
    };
    ExpressionProfileComponent.prototype.addSelections = function (ids) {
        var _this = this;
        var selectionIds = this.getSelectionIds();
        var missingSelectionIds = _.difference(ids, selectionIds);
        var missingGeneExpressions = _.map(missingSelectionIds, function (id) { return _this.expressionProfileTSVService.getGeneExpression(_this.tsv, id); });
        this.selectedGeneExpressions = this.selectedGeneExpressions.concat(missingGeneExpressions);
        missingSelectionIds.forEach(function (id) { _this.setSelectionStyle(id); });
        this.setViewSelectionList();
    };
    ;
    ExpressionProfileComponent.prototype.toggleSelections = function (ids) {
        var selectionIds = this.getSelectionIds();
        var selectionIdsToAdd = _.difference(ids, selectionIds);
        var selectionIdsToRemove = _.intersection(ids, selectionIds);
        this.addSelections(selectionIdsToAdd);
        this.removeSelections(selectionIdsToRemove);
    };
    ExpressionProfileComponent.prototype.setSelectionStyle = function (id) {
        d3.select('#path' + id).classed('selected', true);
    };
    ExpressionProfileComponent.prototype.removeSelectionStyle = function (id) {
        d3.select('#path' + id).classed('selected', false);
    };
    ExpressionProfileComponent.prototype.setSelectionHoverStyle = function (id) {
        d3.select('#path' + id).classed('pathover', true);
    };
    ExpressionProfileComponent.prototype.removeSelectionHoverStyle = function (id) {
        d3.select('#path' + id).classed('pathover', false);
    };
    ExpressionProfileComponent.prototype.setViewSelectionList = function () {
        var rowIds = this.selectedGeneExpressions.map(function (geneExpression) { return geneExpression.id; });
        var rawTSVRows = this.tsv.body.getTSVRows(rowIds);
        var tsvSymbolIndex = this.tsv.getColumnIndex('symbol');
        var tsvIdentifierIndex = this.tsv.getColumnIndex('identifier');
        this.viewSelectionList = rawTSVRows.map(function (row) {
            return { symbol: row.row[tsvSymbolIndex], identifier: row.row[tsvIdentifierIndex] };
        });
    };
    __decorate([
        Input(), 
        __metadata('design:type', String)
    ], ExpressionProfileComponent.prototype, "datasetId", void 0);
    __decorate([
        Input(), 
        __metadata('design:type', Object)
    ], ExpressionProfileComponent.prototype, "selectedDatasets", void 0);
    ExpressionProfileComponent = __decorate([
        Component({
            selector: 'ch-expression-profile',
            templateUrl: './expressionprofile.html'
        }), 
        __metadata('design:paramtypes', [TSVReader, ExpressionProfileService, SessionDataService, ExpressionProfileTSVService, FileResource])
    ], ExpressionProfileComponent);
    return ExpressionProfileComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/expressionprofile/expressionprofile.component.js.map