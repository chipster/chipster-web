import ExpressionProfileService from "./expressionprofile.service";
import Point from "./point";
import Rectangle from "./rectangle";
import Interval from "./interval";
import * as d3 from 'd3';
import SessionDataService from "../../sessiondata.service";
import UtilsService from "../../../../../services/utils.service";
import TSVFile from "../../../../../model/tsv/TSVFile";
import { TSVReader } from "../../../../../services/TSVReader";
import GeneExpression from "./geneexpression";
import ExpressionProfileTSVService from "./expressionprofileTSV.service";

class ExpressionProfile {

    static $inject = ['TSVReader', '$routeParams', '$window', 'ExpressionProfileService', 'SessionDataService', 'ExpressionProfileTSVService'];

    private datasetId: string;
    private tsv: TSVFile;
    private selectedGeneExpressions: Array<GeneExpression>; // selected gene expressions
    private selectedDatasets: any;

    constructor(
                private tsvReader: TSVReader,
                private $routeParams: ng.route.IRouteParamsService,
                private $window: ng.IWindowService,
                private expressionProfileService: ExpressionProfileService,
                private sessionDataService: SessionDataService,
                private expressionProfileTSVService: ExpressionProfileTSVService) {
    }

    $onInit() {
        this.tsvReader.getTSV(this.$routeParams['sessionId'], this.datasetId).subscribe( (result: any) => {
            let parsedTSV = d3.tsv.parseRows(result.data);
            this.tsv = new TSVFile(parsedTSV);
            this.drawLineChart(this.tsv);
        });

        this.selectedGeneExpressions = [];
    }

    drawLineChart(tsv: TSVFile) {
        let that = this;
        // Configurate svg and graph-area
        let expressionprofileWidth = document.getElementById('expressionprofile').offsetWidth;
        let margin = {top: 10, right: 0, bottom: 150, left: 40};
        let size = { width: expressionprofileWidth, height: 600};
        let graphArea = {
            width: size.width,
            height: size.height - margin.top - margin.bottom
        };

        // SVG-element
        let drag = d3.behavior.drag();

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
        let xScale = d3.scale.ordinal().range(chipRange).domain(headers);
        let xAxis = d3.svg.axis().scale(xScale).orient('bottom').ticks(headers.length);
        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(' + margin.left + ',' + graphArea.height + ')')
            .call(xAxis)
            .selectAll("text")
            .attr('transform', 'rotate(-65 0 0)')
            .style('text-anchor', 'end');

        // Linear x-axis to determine selection-rectangle position scaled to tsv-data
        let linearXScale = d3.scale.linear().range([0, graphArea.width - (graphArea.width / headers.length)]).domain([0, headers.length - 1]);
        
        // Y-axis and scale
        let yScale = d3.scale.linear()
                    .range([graphArea.height, 0])
                    .domain([this.expressionProfileTSVService.getDomainBoundaries(tsv).min, this.expressionProfileTSVService.getDomainBoundaries(tsv).max]);
        let yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(5);
        svg.append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate(' + margin.left + ',0 )')
            .call(yAxis);
        
        // Paths
        let pathsGroup = svg.append("g").attr('id', 'pathsGroup').attr('transform', 'translate(' + margin.left + ',0)');
        let lineGenerator = d3.svg.line()
            .x( (d:any,i:number) => xScale( headers[i]) )
            .y( (d:any) => yScale(d) );
        let color = d3.scale.category20();


        let geneExpression = this.expressionProfileTSVService.getGeneExpressions(tsv);
        let orderedExpressionGenes = this.expressionProfileTSVService.orderBodyByFirstValue(geneExpression);
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
        paths.each(function(d) { d.totalLength = this.getTotalLength(); })
            .attr("stroke-dasharray", function(d) { return d.totalLength + " " + d.totalLength; })
            .attr("stroke-dashoffset", function(d) { return d.totalLength; })
            .transition()
            .duration(2000)
            .ease('linear')
            .attr('stroke-dashoffset', 0);

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

        drag.on("dragend", () => {
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

                let ids: Array<number> = []; // path ids found in each interval (not unique list)
                for (let interval: Interval of intervals ) {
                    let intersectingLines = _.filter(interval.lines, line => {
                        return that.expressionProfileService.isIntersecting(line, interval.rectangle);
                    });

                    // Line ids intersecting with selection as an array
                    ids = ids.concat(_.map(intersectingLines, line => line._lineId));
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
        let csvData = this.tsv.getRawData(selectedGeneExpressionIds);
        let data = d3.tsv.formatRows(csvData);
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
        _.forEach(missingSelectionIds, id => {
            this.setSelectionStyle(id);
        });
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


}

export default {
    bindings: {
        datasetId: '<',
        selectedDatasets: '<'
    },
    controller: ExpressionProfile,
    templateUrl: 'app/views/sessions/session/visualization/expressionprofile/expressionprofile.html'
}