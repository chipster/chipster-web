import {Injectable} from "@angular/core";
import Point from "../../views/sessions/session/visualization/model/point";
import {VisualizationTSVService} from "./visualizationTSV.service";
import {PlotData} from "../../views/sessions/session/visualization/model/plotData";

@Injectable()
export class PlotService {

  constructor(private visualizationTSVService: VisualizationTSVService) {

  }

  //Get the points inside the selection Rectangle
  getSelectedDataPoints(dragStartPoint: Point, dragEndPoint: Point, linearXScale: any, linearYScale: any, plotData: Array<PlotData>): Array<string> {


    let startXValue = linearXScale.invert(dragStartPoint.x);
    let endXValue = linearXScale.invert(dragEndPoint.x);

    let startYValue = linearYScale.invert(dragStartPoint.y);
    let endYValue = linearYScale.invert(dragEndPoint.y);

    let selectedDataPoints: Array<string> = [];

    // get the chip values which are in this range

    plotData.forEach(function (val) {
      if (startXValue < endXValue) {
        if (startYValue < endYValue) {
          if (val.plotPoint.x <= endXValue && val.plotPoint.x >= startXValue && val.plotPoint.y <= endYValue && val.plotPoint.y >= startYValue) {
            selectedDataPoints.push(val.id);
          }
        } else if (startYValue > endYValue) {
          if (val.plotPoint.x <= endXValue && val.plotPoint.x >= startXValue && val.plotPoint.y >= endYValue && val.plotPoint.y <= startYValue) {
            selectedDataPoints.push(val.id);
          }
        }
      } else if (startXValue > endXValue) {
        if (startYValue < endYValue) {
          if (val.plotPoint.x >= endXValue && val.plotPoint.x <= startXValue && val.plotPoint.y <= endYValue && val.plotPoint.y >= startYValue) {
            selectedDataPoints.push(val.id);
          }
        } else if (startYValue > endYValue) {
          if (val.plotPoint.x >= endXValue && val.plotPoint.x <= startXValue && val.plotPoint.y >= endYValue && val.plotPoint.y <= startYValue) {
            selectedDataPoints.push(val.id);
          }
        }
      }

    });


    return selectedDataPoints;


  }

}
