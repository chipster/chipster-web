import ExpressionProfileService from "./expressionprofile.service";
import Point from "../model/point";
import Rectangle from "./rectangle";
import Interval from "./interval";
import SessionDataService from "../../sessiondata.service";
import UtilsService from "../../../../../services/utils.service";
import TSVFile from "../../../../../model/tsv/TSVFile";
import { TSVReader } from "../../../../../shared/services/TSVReader";
import GeneExpression from "./geneexpression";
import {ExpressionProfileTSVService} from "./expressionprofileTSV.service";
import TSVRow from "../../../../../model/tsv/TSVRow";
import * as d3 from "d3";
import * as _ from "lodash";
import {Component, Input, Inject} from "@angular/core";
import Line from "./line";
import FileResource from "../../../../../shared/resources/fileresource";

@Component({
  selector: 'ch-expression-profile',
  templateUrl: './expressionprofile.html'
})
export class ExpressionProfileComponent {

    @Input()
    private datasetId: string;

    @Input()
    private selectedDatasets: any;

    private tsv: TSVFile;
    private selectedGeneExpressions: Array<GeneExpression>; // selected gene expressions
    private viewSelectionList: Array<any>;

    constructor(
                private tsvReader: TSVReader,
                @Inject('$routeParams') private $routeParams: ng.route.IRouteParamsService,
                @Inject('$window') private $window: ng.IWindowService,
                private expressionProfileService: ExpressionProfileService,
                @Inject('SessionDataService') private sessionDataService: SessionDataService,
                private expressionProfileTSVService: ExpressionProfileTSVService,
                private fileResource: FileResource) {}

    ngOnInit() {
        const datasetName = this.selectedDatasets[0].name;
        this.fileResource.getData(this.$routeParams['sessionId'], this.datasetId).subscribe( (result: any) => {
            let parsedTSV = d3.tsvParseRows(result);
            this.tsv = new TSVFile(parsedTSV, this.datasetId, datasetName);
            this.drawLineChart(this.tsv);
        });

        this.selectedGeneExpressions = [];
    }

    drawLineChart(tsv: TSVFile) {
        const that = this;
        // Configurate svg and graph-area
        let expressionprofileWidth = document.getElementById('expressionprofile').offsetWidth;
        const margin = {top: 10, right: 0, bottom: 150, left: 40};
        let size = { width: expressionprofileWidth, height: 600};
        let graphArea = {
            width: size.width,
            height: size.height - margin.top - margin.bottom
        };

        // SVG-element
        let drag = d3.drag();
        let svg = d3.select('#expressionprofile')
            .append('svg')
            .attr('width', size.width)
            .attr('height', size.height)
            .attr('id', 'svg')
            .style('margin-top', margin.top + 'px')
            .call(drag);

        // Custom headers for x-axis
        let firstDataset: any = _.first(this.selectedDatasets);
        let phenodataDescriptions = _.filter(firstDataset.metadata, (metadata:any) => {
            return metadata.key === 'description';
        });

        // Change default headers to values defined in phenodata if description value has been defined
        let headers = _.map(this.expressionProfileTSVService.getChipHeaders(tsv), header => {
            // find if there is a phenodata description matching header and containing a value
            let phenodataHeader:any = _.find(phenodataDescriptions, (item:any) => {
                return item.column === header && item.value !== null;
            });
            return phenodataHeader ? phenodataHeader.value : header;
        });

        // X-axis and scale
        // Calculate points (in pixels) for positioning x-axis points
        let chipRange = _.map(headers, (item, index) => (graphArea.width / headers.length) * index );
        let xScale = d3.scaleOrdinal().range(chipRange).domain(headers);
        let xAxis = d3.axisBottom(xScale).ticks(headers.length);
        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(' + margin.left + ',' + graphArea.height + ')')
            .call(xAxis)
            .selectAll("text")
            .attr('transform', 'rotate(-65 0 0)')
            .style('text-anchor', 'end');

        // Linear x-axis to determine selection-rectangle position scaled to tsv-data
        let linearXScale = d3.scaleLinear().range([0, graphArea.width - (graphArea.width / headers.length)]).domain([0, headers.length - 1]);

        // Y-axis and scale
        let yScale = d3.scaleLinear()
                    .range([graphArea.height, 0])
                    .domain([this.expressionProfileTSVService.getDomainBoundaries(tsv).min, this.expressionProfileTSVService.getDomainBoundaries(tsv).max]);
        let yAxis = d3.axisLeft(yScale).ticks(5);
        svg.append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate(' + margin.left + ',0 )')
            .call(yAxis);

        // Paths
        let pathsGroup = svg.append("g").attr('id', 'pathsGroup').attr('transform', 'translate(' + margin.left + ',0)');
        let lineGenerator = d3.line()
            .x( (d: [number,number], i:number) => parseFloat(xScale( headers[i]).toString() ))
            .y( (d:any) => yScale(d) );

        let color = d3.scaleOrdinal(d3.schemeCategory20);

        let geneExpressions = this.expressionProfileTSVService.getGeneExpressions(tsv);
        let orderedExpressionGenes = this.expressionProfileTSVService.orderBodyByFirstValue(geneExpressions);

        let paths = pathsGroup.selectAll('.path')
            .data(orderedExpressionGenes)
            .enter()
            .append('path')
            .attr('class', 'path')
            .attr('id', (d: GeneExpression) => 'path' + d.id)
            .attr('d', (d: GeneExpression) => lineGenerator( d.values ) )
            .attr('fill', 'none')
            .attr('stroke-width', 1)
            .attr('stroke', (d: any, i: number) => {
            //     There are 20 different colors in colorcategory. Setting same color for each consecutive 5% of lines.
            //     So for 100 lines 5 first lines gets first color in category, next 5 lines get second color and so on.
                let colorIndex = (_.floor( (i / tsv.body.size() ) * 20)).toString();
                return color(colorIndex)
            })
            .on('mouseover', (d: any) => {
                that.setSelectionHoverStyle(d.id);
            })
            .on('mouseout', (d: any) => {
                that.removeSelectionHoverStyle(d.id);
            })
            .on('click', (d:GeneExpression) => {
                let id = d.id;
                let isCtrl = UtilsService.isCtrlKey(d3.event);
                let isShift = UtilsService.isShiftKey(d3.event);
                if(isShift) {
                    that.addSelections([id]);
                } else if(isCtrl) {
                    that.toggleSelections([id.toString()]);
                } else {
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
        let dragGroup = svg.append("g").attr('id', 'dragGroup').attr('transform', 'translate(' + margin.left + ',0)');

        // Create selection rectangle
        let band = dragGroup.append("rect")
            .attr("width", 0)
            .attr("height", 0)
            .attr("x", 0)
            .attr("y", 0)
            .attr("class", "band")
            .attr('id', 'band');

        let bandPos = [-1,-1];
        let startPoint = new Point(-1, -1); // startpoint for dragging

        // Register drag handlers
        drag.on("drag", () => {
            let pos = d3.mouse(document.getElementById('dragGroup'));
            let endPoint = new Point(pos[0], pos[1]);

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

        drag.on("end", () => {
            let pos = d3.mouse(document.getElementById('dragGroup'));
            let endPoint = new Point(pos[0], pos[1]);

            if( (startPoint.x !== -1 && startPoint.y !== -1) && ((startPoint.x !== endPoint.x) && (startPoint.y !== endPoint.y))     ) {
                this.resetSelections();
                d3.selectAll('.path').attr('stroke-width', 1);
                let p1 = new Point(endPoint.x, endPoint.y);
                let p2 = new Point(startPoint.x, startPoint.y);

                let intervalIndexes = that.expressionProfileService.getCrossingIntervals(endPoint, startPoint, linearXScale, tsv);
                var intervals: Array<Interval> = [];

                // create intervals
                for( let chipValueIndex = intervalIndexes.start; chipValueIndex < intervalIndexes.end; chipValueIndex++ ) {
                    let lines = that.expressionProfileService.createLines(tsv, chipValueIndex, linearXScale, yScale);
                    let intervalStartIndex = chipValueIndex;

                    let rectangle = new Rectangle(endPoint.x, endPoint.y, startPoint.x, startPoint.y);
                    intervals.push(new Interval(intervalStartIndex, lines, rectangle));
                }

                let ids: Array<string> = []; // path ids found in each interval (not unique list)
                for (let interval of intervals ) {
                    let intersectingLines = _.filter(interval.lines, (line: Line) => {
                        return that.expressionProfileService.isIntersecting(line, interval.rectangle);
                    });

                    // Line ids intersecting with selection as an array
                    ids = ids.concat(_.map(intersectingLines, (line:Line) => line.lineId));
                };

                this.resetSelections();
                this.addSelections(_.uniq(ids));

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
                .attr("y", 0)
        }

    }

    createNewDataset() {
        let selectedGeneExpressionIds = this.getSelectionIds();
        let tsvData = this.tsv.getRawDataByRowIds(selectedGeneExpressionIds);
        let data = d3.tsvFormatRows(tsvData);
        this.sessionDataService.createDerivedDataset("dataset.tsv", [this.datasetId], "Expression profile", data);
    }

    getSelectionIds(): Array<string> {
        return this.selectedGeneExpressions.map( (expression: GeneExpression) => expression.id );
    }

    resetSelections(): void {
        this.removeSelections(this.getSelectionIds());
        this.selectedGeneExpressions.length = 0;
    }

    removeSelections(ids: Array<string>): void {
        for( let id of ids ) {
            this.removeSelectionStyle(id);
        }

        let selectedGeneIds = _.filter(this.getSelectionIds(), selectionId => !_.includes(ids, selectionId));
        this.selectedGeneExpressions = _.map(selectedGeneIds, id => this.expressionProfileTSVService.getGeneExpression(this.tsv, id));
    }

    addSelections(ids: Array<string>) {
        let selectionIds = this.getSelectionIds();
        let missingSelectionIds = _.difference(ids, selectionIds);
        let missingGeneExpressions = _.map(missingSelectionIds, id => this.expressionProfileTSVService.getGeneExpression(this.tsv, id));
        this.selectedGeneExpressions = this.selectedGeneExpressions.concat( missingGeneExpressions );
        missingSelectionIds.forEach( id => { this.setSelectionStyle(id) });
        this.setViewSelectionList();
    };

    toggleSelections(ids: Array<string>) {
        let selectionIds = this.getSelectionIds();
        let selectionIdsToAdd = _.difference(ids, selectionIds);
        let selectionIdsToRemove = _.intersection(ids, selectionIds);
        this.addSelections(selectionIdsToAdd);
        this.removeSelections(selectionIdsToRemove);
    }

    setSelectionStyle(id: string) {
        d3.select('#path' + id).classed('selected', true);
    }

    removeSelectionStyle(id: string) {
        d3.select('#path' + id).classed('selected', false);
    }

    setSelectionHoverStyle(id: string) {
        d3.select('#path' + id).classed('pathover', true)
    }

    removeSelectionHoverStyle(id: string) {
        d3.select('#path' + id).classed('pathover', false);
    }

    setViewSelectionList(): void {
        let rowIds = this.selectedGeneExpressions.map( (geneExpression: GeneExpression) => geneExpression.id );
        let rawTSVRows = this.tsv.body.getTSVRows(rowIds);
        let tsvSymbolIndex = this.tsv.getColumnIndex('symbol');
        let tsvIdentifierIndex = this.tsv.getColumnIndex('identifier');
        this.viewSelectionList = rawTSVRows.map( (row: TSVRow) => {
            return {symbol: row.row[tsvSymbolIndex], identifier: row.row[tsvIdentifierIndex]};
        });
    }

}
