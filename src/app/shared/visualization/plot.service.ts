import { Injectable } from "@angular/core";
import Point from "../../views/sessions/session/visualization/model/point";
import { VisualizationTSVService } from "./visualizationTSV.service";
import { PlotData } from "../../views/sessions/session/visualization/model/plotData";

@Injectable()
export class PlotService {
  constructor(private visualizationTSVService: VisualizationTSVService) {}

  // Get the points inside the selection Rectangle
  getSelectedDataPoints(
    dragStartPoint: Point,
    dragEndPoint: Point,
    linearXScale: any,
    linearYScale: any,
    plotData: Array<PlotData>
  ): Array<string> {
    console.log(linearXScale);
    const startXValue = linearXScale.invert(dragStartPoint.x);
    const endXValue = linearXScale.invert(dragEndPoint.x);

    const startYValue = linearYScale.invert(dragStartPoint.y);
    const endYValue = linearYScale.invert(dragEndPoint.y);

    const selectedDataPoints: Array<string> = [];

    console.log(startXValue);
    console.log(startYValue);
    console.log(endXValue);
    console.log(endYValue);

    // get the chip values which are in this range

    plotData.forEach(function(val) {
      if (startXValue < endXValue) {
        if (startYValue < endYValue) {
          if (
            val.plotPoint.x <= endXValue &&
            val.plotPoint.x >= startXValue &&
            val.plotPoint.y <= endYValue &&
            val.plotPoint.y >= startYValue
          ) {
            selectedDataPoints.push(val.id);
            console.log(val.plotPoint);
          }
        } else if (startYValue > endYValue) {
          if (
            val.plotPoint.x <= endXValue &&
            val.plotPoint.x >= startXValue &&
            val.plotPoint.y >= endYValue &&
            val.plotPoint.y <= startYValue
          ) {
            selectedDataPoints.push(val.id);
            console.log(val.plotPoint);
          }
        }
      } else if (startXValue > endXValue) {
        if (startYValue < endYValue) {
          if (
            val.plotPoint.x >= endXValue &&
            val.plotPoint.x <= startXValue &&
            val.plotPoint.y <= endYValue &&
            val.plotPoint.y >= startYValue
          ) {
            selectedDataPoints.push(val.id);
            console.log(val.plotPoint);
          }
        } else if (startYValue > endYValue) {
          if (
            val.plotPoint.x >= endXValue &&
            val.plotPoint.x <= startXValue &&
            val.plotPoint.y >= endYValue &&
            val.plotPoint.y <= startYValue
          ) {
            selectedDataPoints.push(val.id);
            console.log(val.plotPoint);
          }
        }
      }
    });

    console.log(selectedDataPoints);
    return selectedDataPoints;
  }
}
