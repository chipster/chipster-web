import Dataset from "../../../../../model/session/dataset";
import CSVReader from "../../../../../services/csv/CSVReader";
import CSVModel from "../../../../../services/csv/CSVModel";
import ExpressionProfileService from "./expressionprofile.service";
import Line from "./line";
import Point from "./point";
import Rectangle from "./rectangle";
import Interval from "./interval";
import * as d3 from 'd3';
import {csv} from "~d3/index";

class ExpressionProfile {

    static $inject = ['CSVReader', '$routeParams', '$window', 'ExpressionProfileService'];

    private datasetId: string;
    private d3: any;
    private csvModel: CSVModel;
    private expressionProfileService: ExpressionProfileService;
    private selectedLines: Array<Array<string>>;
    private lines: Array<Array<string>>;

    constructor(private csvReader: CSVReader,
                private $routeParams: ng.route.IRouteParamsService,
                private $window: ng.IWindowService,
                private expressionProfileService: ExpressionProfileService) {
        this.expressionProfileService = new ExpressionProfileService();
    }

    $onInit() {
        this.csvReader.getCSV(this.$routeParams.sessionId, this.datasetId).then( (csvModel: CSVModel) => {
            this.csvModel = csvModel;
            this.drawLineChart(csvModel);
        });
    }

    drawLineChart(csvModel: CSVModel) {
        let expressionprofileWidth = document.getElementById('expressionprofile').offsetWidth;
        let expressionProfileService = this.expressionProfileService;

        // Configurate svg and graph-area
        let margin = {top: 10, right: 0, bottom: 150, left: 40};
        let size = { width: expressionprofileWidth, height: 600};
        let graphArea = {
            width: size.width,
            height: size.height - margin.top - margin.bottom
        };

        // SVG-element
        let svg = d3.select('#expressionprofile')
            .append('svg')
            .attr('width', size.width)
            .attr('height', size.height)
            .attr('id', 'svg')
            .style('margin-top', margin.top + 'px');

        // Custom headers for x-axis
        let headers = csvModel.getChipHeaders();

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

        // Linear x-axis to determine selection-rectangle position scaled to csv-data
        let linearXScale = d3.scale.linear().range([0, graphArea.width - (graphArea.width / headers.length)]).domain([0, headers.length - 1]);

        // Y-axis and scale
        let yScale = d3.scale.linear().range([graphArea.height, 0]).domain([csvModel.domainBoundaries.min, csvModel.domainBoundaries.max]);
        let yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(5);
        svg.append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate(' + margin.left + ',0 )')
            .call(yAxis);
        
        // Paths
        let pathsGroup = svg.append("g").attr('id', 'pathsGroup').attr('transform', 'translate(' + margin.left + ',0)');
        let lineGenerator = d3.svg.line()
            .x( (d,i) => xScale( headers[i]) )
            .y( d => yScale(d) );
        let color = d3.scale.category20();
        let paths = pathsGroup.selectAll('.path')
            .data(csvModel.body)
            .enter()
            .append('path')
            .attr('class', 'path')
            .attr('id', (d,i) => 'path' + d[0])
            .attr('d', (d) => lineGenerator( csvModel.getItemsByIndexes(csvModel.chipValueIndexes, d) ) )
            .attr('fill', 'none')
            .attr('stroke-width', 1)
            .attr('stroke', (d, i) => {
                let colorIndex = _.floor( (i / csvModel.body.length) * 20);
                return color(colorIndex)
            });




        // Dragging
        let dragGroup = svg.append("g").attr('id', 'dragGroup').attr('transform', 'translate(' + margin.left + ',0)');
        let drag = d3.behavior.drag();

        // Create selection rectangle
        let band = dragGroup.append("rect")
            .attr("width", 0)
            .attr("height", 0)
            .attr("x", 0)
            .attr("y", 0)
            .attr("class", "band")
            .attr('id', 'band');

        let bandPos = [-1,-1];



        // Register drag handlers
        drag.on("drag", () => {
            let pos = d3.mouse(document.getElementById('dragGroup'));

            if (pos[0] < bandPos[0]) {
                d3.select(".band").attr("transform", "translate(" + (pos[0]) + "," + bandPos[1] + ")");
            }
            if (pos[1] < bandPos[1]) {
                d3.select(".band").attr("transform", "translate(" + (pos[0]) + "," + pos[1] + ")");
            }
            if (pos[1] < bandPos[1] && pos[0] > bandPos[0]) {
                d3.select(".band").attr("transform", "translate(" + (bandPos[0]) + "," + pos[1] + ")");
            }

            //set new position of band when user initializes drag
            if (bandPos[0] === -1) {
                bandPos = pos;
                d3.select(".band").attr("transform", "translate(" + bandPos[0] + "," + bandPos[1] + ")");
            }

            d3.select(".band").transition().duration(1)
                .attr("width", Math.abs(bandPos[0] - pos[0]))
                .attr("height", Math.abs(bandPos[1] - pos[1]));
        });

        drag.on("dragend", () => {
            if(bandPos[0] !== -1 && bandPos[1] !== -1) {

                d3.selectAll('.path').attr('stroke-width', 1);
                let pos = d3.mouse(document.getElementById('dragGroup'));
                let p1 = new Point(pos[0], pos[1]);
                let p2 = new Point(bandPos[0], bandPos[1]);

                let intervalIndexes = expressionProfileService.getCrossingIntervals(p1, p2, linearXScale, csvModel);
                var intervals: Array<Interval> = [];

                // create intervals
                for( let chipValueIndex = intervalIndexes.start; chipValueIndex < intervalIndexes.end; chipValueIndex++ ) {
                    let lines = expressionProfileService.createLines(csvModel, chipValueIndex, linearXScale, yScale);
                    let intervalStartIndex = chipValueIndex;

                    let rectangle = new Rectangle(p1.x, p1.y, p2.x, p2.y);
                    intervals.push(new Interval(intervalStartIndex, lines, rectangle));
                }

                let lines = [];

                _.forEach(intervals, interval => {
                    let intersectingLines = _.filter(interval.lines, line => {
                        return expressionProfileService.isIntersecting(line, interval.rectangle);
                    });

                    // Line ids intersecting with selection as an array
                    let csvIds = _.map(intersectingLines, line => line._csvIndex);

                    // set styles for selected lines
                    _.forEach(csvIds, pathId => {
                        d3.select('#path' + pathId).attr('stroke-width', 3);
                    });

                    lines = _.merge(lines, csvModel.getCSVLines(csvIds));
                });

                this.lines  = _.uniqBy(lines, line => line[0]);
                resetSelectionRectangle();

            }

        });



        // Create
        let zoomOverlay = svg.append("rect")
            .attr("width", graphArea.width)
            .attr("height", graphArea.height)
            .attr("class", "zoomOverlay")
            .call(drag);

        function resetSelectionRectangle() {
            bandPos = [-1, -1];
            d3.select('.band')
                .attr("width", 0)
                .attr("height", 0)
                .attr("x", 0)
                .attr("y", 0)
        }

    }

    createNewDataset() {

    }

}

export default {
    bindings: {
        datasetId: '<',
        src: '<',
        selectedDatasets: '<'
    },
    controller: ExpressionProfile,
    templateUrl: 'views/sessions/session/visualization/expressionprofile/expressionprofile.html'
}