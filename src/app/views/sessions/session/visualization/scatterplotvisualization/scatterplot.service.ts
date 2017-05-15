import {Injectable} from "@angular/core";
import Point from "../model/point";
import TSVFile from "../../../../../model/tsv/TSVFile";
import {VisualizationTSVService} from "../visualizationTSV.service";
import {PlotData} from "./plotData";

@Injectable()
export class ScatterPlotService {

  constructor(private visualizationTSVService: VisualizationTSVService) {

  }

  //Get the points inside the selection Rectangle
  getSelectedGeneIds(dragStartPoint: Point, dragEndPoint: Point, linearXScale: any, linearYScale: any, plotData: Array<PlotData>): Array<string> {


    let startXValue = linearXScale.invert(dragStartPoint.x);
    let endXValue = linearXScale.invert(dragEndPoint.x);

    let startYValue = linearYScale.invert(dragStartPoint.y);
    let endYValue = linearYScale.invert(dragEndPoint.y);

    let selectedGenes: Array<string> = [];

    // get the chip values which are in this range

    console.log(startXValue);
    console.log(startYValue);
    console.log(endXValue);
    console.log(endYValue);

    plotData.forEach(function (val) {
      if (startXValue < endXValue) {
        if (startYValue < endYValue) {
          if (val.plotPoint.x <= endXValue && val.plotPoint.x >= startXValue && val.plotPoint.y <= endYValue && val.plotPoint.y >= startYValue) {
            selectedGenes.push(val.geneID);
          }
        } else if (startYValue > endYValue) {
          if (val.plotPoint.x <= endXValue && val.plotPoint.x >= startXValue && val.plotPoint.y >= endYValue && val.plotPoint.y <= startYValue) {
            selectedGenes.push(val.geneID);
          }
        }
      } else if (startXValue > endXValue) {
        if (startYValue < endYValue) {
          if (val.plotPoint.x >= endXValue && val.plotPoint.x <= startXValue && val.plotPoint.y <= endYValue && val.plotPoint.y >= startYValue) {
            selectedGenes.push(val.geneID);
          }
        } else if (startYValue > endYValue) {
          if (val.plotPoint.x >= endXValue && val.plotPoint.x <= startXValue && val.plotPoint.y >= endYValue && val.plotPoint.y <= startYValue) {
            selectedGenes.push(val.geneID);
          }
        }
      }

    });


    return selectedGenes;


  }

}
