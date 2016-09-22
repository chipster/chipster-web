import Dataset from "../../../../../model/session/dataset";
import CSVReader from "../../../../../services/csv/CSVReader";
import CSVModel from "../../../../../services/csv/CSVModel";

class DomainBoundaries {

    min: number;
    max: number;

    constructor(min: number, max: number) {
        this.min = min;
        this.max = max;
    }

}

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
        let expressionprofileWidth = document.getElementById('expressionprofile').offsetWidth;

        let margin = {top: 10, right: 10, bottom: 150, left: 20};
        let size = { width: expressionprofileWidth, height: 600};

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

        let orderedValues = this.orderChipValues(values);

        let domainBoundaries = this.getDomainBoundaries(orderedValues);
        domainBoundaries = this.addThreshold(domainBoundaries);
        //add threshold to max and min so that threshold values can be seen on the graph.


        // Calculate points (in pixels) for positioning x-axis points
        let chipRange = _.map(headers, (item, index) => (size.width / headers.length) * index);

        let xScale = d3.scale.ordinal().range(chipRange).domain(headers);
        let yScale = d3.scale.linear().range([graphArea.height, 0]).domain([domainBoundaries.min, domainBoundaries.max]);

        let color = d3.scale.category20();
        let xAxis = d3.svg.axis().scale(xScale).orient('bottom').ticks(headers.length);
        let yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(5);

        let lineGenerator = d3.svg.line()
            .x( (d,i) => xScale( headers[i]) )
            .y( d => yScale(d) );

        // Paths
        _.forEach(orderedValues, (item, index, array) => {

            // colorIndex should be same for each 1/20 part of all arrays
            // resulting each 1/20 of all lines getting same color index.
            // All arrays are ordered by their first value so the line colors
            // each group of lines get their own color making it easier to
            // see where each line moves
            let colorIndex = _.floor( index / array.length * 20);

            g.append('path')
                .attr('d', lineGenerator(item))
                .attr('stroke', () => color( colorIndex )  )
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

    /*
     * Parse strings in two-dimensional array to numbers
     */
    parseValues(values: Array<Array<string>>): Array<Array<number>> {
        return _.map(values, valueArray => _.map(valueArray, value => parseFloat(value)));
    }

    /*
     * Order two-dimensional array by the first number in the arrays
     */
    orderByFirstValues(values: Array<Array<number>>) {
        return _.orderBy(values, [ valueArray => _.head(valueArray) ]);
    }

    /*
     * Order two-dimensional array using first item in every subarray from largest to smallest
     */
    orderChipValues(values: Array<Array<string>>): Array<Array<number>> {
        let numberArrays = this.parseValues(values);
        return this.orderByFirstValues(numberArrays);
    }

    /*
     * max & min value from two-dimensional array
     */
    getDomainBoundaries(values: Array<Array<number>>): DomainBoundaries {
        let flatValues = _.map(_.flatten(values), item => parseFloat(item));
        let min = _.min(flatValues);
        let max = _.max(flatValues);
        return new DomainBoundaries(min, max);
    }

    /*
     * Add threshold to min and max. Needed for lines to show on without being cut of on max and min
     */
    addThreshold(domainBoundaries: DomainBoundaries): DomainBoundaries {
        let min = domainBoundaries.min - domainBoundaries.min * 0.05;
        let max = domainBoundaries.max + domainBoundaries.max * 0.05;
        return new DomainBoundaries(min, max);
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