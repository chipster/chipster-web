import {Component, Input, OnChanges} from "@angular/core";
import * as d3 from "d3";
import Dataset from "../../../../../model/session/dataset";
import {ExpressionProfileTSVService} from "../expressionprofile/expressionprofileTSV.service";
import {FileResource} from "../../../../../shared/resources/fileresource";
import TSVFile from "../../../../../model/tsv/TSVFile";
import {SessionDataService} from "../../sessiondata.service";
import Point from "../model/point";


@Component({
  selector: 'ch-scatter-plot',
  templateUrl: './scatterplot.html'

})

export class ScatterPlotComponent implements OnChanges {

  @Input()
  private dataset: Dataset;
  private tsv: TSVFile;
  private errorMessage: string;
  private plotData: Array<Point> = [];


  constructor(private expressionProfileTSVService: ExpressionProfileTSVService,
              private fileResource: FileResource,
              private sessionDataService: SessionDataService) {

  }

  ngOnChanges() {
    const datasetName = this.dataset.name;
    this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset.datasetId)
      .subscribe((result: any) => {
        let parsedTSV = d3.tsvParseRows(result);
        this.tsv = new TSVFile(parsedTSV, this.dataset.datasetId, datasetName);
        console.log(this.tsv);
        if (this.expressionProfileTSVService.containsChipHeaders(this.tsv)) {
          this.drawScatterPlot(this.tsv);
        } else {
          this.errorMessage = `Only microarray data supported, didn’t find any columns starting with chip.`;
        }
      })
  }

  drawScatterPlot(tsv: TSVFile) {

    var self = this;
    let scatterPlotWidth = document.getElementById('scatterplot').offsetWidth;
    const margin = {top: 10, right: 0, bottom: 50, left: 40};
    let size = {width: scatterPlotWidth, height: 600};
    let scatterPlotArea = {
      width: size.width,
      height: size.height - margin.top - margin.bottom
    };

    //Define the SVG
    let svg = d3.select("#scatterplot").append('svg').attr('width', size.width+margin.left+margin.right).attr('height', size.height+margin.top+margin.bottom).attr('id', 'svg').style('margin-top', margin.top + 'px');


    //Adding the X-axis



    let xScale = d3.scaleLinear().range([0, scatterPlotArea.width]).domain([this.expressionProfileTSVService.getDomainBoundaries(tsv).min, this.expressionProfileTSVService.getDomainBoundaries(tsv).max]);
    console.log(xScale);
    let xAxis = d3.axisBottom(xScale).ticks(8);
    svg.append('g')
      .attr('class', 'x axis').attr('transform', 'translate(' + margin.left + ',' + scatterPlotArea.height + ')')
      .call(xAxis);

    //Adding the Y-axis
    let yScale = d3.scaleLinear().range([scatterPlotArea.height, 0]).domain([this.expressionProfileTSVService.getDomainBoundaries(tsv).min, this.expressionProfileTSVService.getDomainBoundaries(tsv).max]);
    let yAxis = d3.axisLeft(yScale).ticks(8);
    svg.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + margin.left + ',0 )')
      .call(yAxis);

    let geneValue = this.expressionProfileTSVService.getGeneExpressions(tsv);
    let orderedGenesValues = this.expressionProfileTSVService.orderBodyByFirstValue(geneValue);
    console.log(orderedGenesValues);

    // Creating points for scatter plot combining two chip columns
    orderedGenesValues.forEach(function (geneRow) {

      self.plotData.push(new Point(geneRow.values[0], geneRow.values[1]));

    });

    console.log(self.plotData);


    svg.selectAll(".dot").data(self.plotData)
       .enter().append("circle")
       .attr("class","dot")
       .attr("r",3)
       .attr("cx",function(d){ return xScale(d.x);})
       .attr("cy",function(d){ return yScale(d.y);})
       .attr("fill","red");

  }


}




