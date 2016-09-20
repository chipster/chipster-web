import Dataset from "../../../../../model/session/dataset";
import CSVReader from "../../../../../services/csv/CSVReader";
import CSVModel from "../../../../../services/csv/CSVModel";

class ExpressionProfile {

    static $inject = ['CSVReader', '$routeParams', '$window'];

    private datasetId: string;
    private src: string;
    private selectedDatasets: Array<Dataset>;
    private d3: any;
    private csvModel: CSVModel;

    constructor(private csvReader: CSVReader, private $routeParams: ng.route.IRouteParamsService, private $window: ng.IWindowService) {}

    $onInit() {
        this.d3 = this.$window['d3'];

        this.csvReader.getCSV(this.$routeParams.sessionId, this.datasetId).then( (csvModel: CSVModel) => {
            this.csvModel = csvModel;
            this.drawLineChart();
        });
    }

    drawLineChart() {
        let margin = {top: 10, right: 10, bottom: 200, left: 20};
        let size = { width: 1000, height: 600};

        let graphArea = {
            width: size.width - margin.left - margin.right,
            height: size.height - margin.top - margin.bottom
        };

        let svg = d3.select('#expressionprofile')
            .append('svg')
            .attr('width', size.width)
            .attr('height', size.height)
            .style('margin-top', margin.top + 'px');

        let g = svg.append("g").attr('transform', 'translate(' + margin.left + ',0)');

        let headers = this.csvModel.getChipHeaders();
        let values = this.csvModel.getChipValues();

        // max & min value from two-dimensional array
        let flatValues = _.map(_.flatten(values), item => parseInt(item));
        let maxValue = _.max(flatValues);
        let minValue = _.min(flatValues);

        //add threshold to max and min so that threshold values can be seen on the graph.
        maxValue += maxValue * 0.05;
        minValue -= minValue * 0.05;

        // Calculate points (in pixels) for positioning x-axis points
        let chipRange = _.map(headers, (item, index) => (size.width / headers.length) * index);

        let xScale = d3.scale.ordinal().range(chipRange).domain(headers);
        let yScale = d3.scale.linear().range([graphArea.height, 0]).domain([minValue, maxValue]);

        let color = d3.scale.category20();
        let xAxis = d3.svg.axis().scale(xScale).orient('bottom').ticks(headers.length);
        let yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(5);

        let lineGenerator = d3.svg.line()
            .x( (d,i) => xScale( headers[i]) )
            .y( d => yScale(d) );

        // Paths
        _.forEach(values, (item, index) => {
            g.append('path')
                .attr('d', lineGenerator(item))
                .attr('stroke', () => color(index))
                .attr('stroke-width', 1)
                .attr('fill', 'none')
                .attr('transform', 'translate(' + margin.left + ',0)');
        });

        // x-axis
        g.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(' + margin.left + ',' + graphArea.height + ')')
            .call(xAxis)
            .selectAll("text")
                .attr('transform', 'rotate(-65 0 0)')
                .style('text-anchor', 'end');

        // y-axis
        g.append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate(' + margin.left + ',0 )')
            .call(yAxis);



    }

}

export default {
    bindings: {
        datasetId: '<',
        src: '<',
        selectedDatasets: '<'
    },
    controller: ExpressionProfile,
    template: '<div id="expressionprofile"></div>'
}