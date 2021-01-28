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
    const startXValue = linearXScale.invert(dragStartPoint.x);
    const endXValue = linearXScale.invert(dragEndPoint.x);

    const startYValue = linearYScale.invert(dragStartPoint.y);
    const endYValue = linearYScale.invert(dragEndPoint.y);

    // get the chip values which are in this range

    const minX = Math.min(startXValue, endXValue);
    const maxX = Math.max(startXValue, endXValue);
    const minY = Math.min(startYValue, endYValue);
    const maxY = Math.max(startYValue, endYValue);

    const selectedDataPoints = plotData
      .filter(
        val => 
          val.plotPoint.x <= maxX &&
          val.plotPoint.x >= minX &&
          val.plotPoint.y <= maxY &&
          val.plotPoint.y >= minY)
      .map(val => val.id);

    return selectedDataPoints;
  }
}
