import { Injectable } from "@angular/core";
import * as d3 from "d3";
import Point from "../../views/sessions/session/visualization/model/point";
import { VisualizationTSVService } from "./visualizationTSV.service";
import { PlotData } from "../../views/sessions/session/visualization/model/plotData";

/**
 * @description position of the mouse or the finger, in the coordinates of the given node
 *
 * d3.pointer() reads clientX and clientY of the event, which a touch event
 * doesn't have: its coordinates are in its touch lists. Without this a tap gives
 * NaN coordinates, and because every comparison with NaN is false, the tap is
 * taken for a selection rectangle, which then selects nothing and clears the
 * selection instead.
 *
 * changedTouches is the right list for both ends of a tap: it holds the touch
 * that started at touchstart and the one that was lifted at touchend, where
 * touches is already empty.
 *
 * A drag event names the touch that the gesture follows in its identifier, so
 * pick that one from the list. Otherwise a second finger anywhere on the plot
 * would move the position of the first one, and the gesture would measure from
 * one finger to the other.
 */
export function pointerPosition(event: any, node: Element): Point {
  const sourceEvent = event.sourceEvent ?? event;
  const touches: Array<any> = Array.from(sourceEvent.changedTouches ?? sourceEvent.touches ?? []);
  const touch = touches.find((candidate) => candidate.identifier === event.identifier) ?? touches[0];
  const pos = d3.pointer(touch ?? event, node);
  return new Point(pos[0], pos[1]);
}

@Injectable()
export class PlotService {
  constructor(private visualizationTSVService: VisualizationTSVService) {}

  // Get the points inside the selection Rectangle
  getSelectedDataPoints(
    dragStartPoint: Point,
    dragEndPoint: Point,
    linearXScale: any,
    linearYScale: any,
    plotData: Array<PlotData>,
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
        (val) =>
          val.plotPoint.x <= maxX && val.plotPoint.x >= minX && val.plotPoint.y <= maxY && val.plotPoint.y >= minY,
      )
      .map((val) => val.id);

    return selectedDataPoints;
  }
}
