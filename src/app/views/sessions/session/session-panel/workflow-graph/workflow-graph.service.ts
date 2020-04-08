import { Injectable } from "@angular/core";
import { DatasetService } from "../../dataset.service";
import { DatasetNode } from "./dataset-node";

/**
 * @desc Service functions needed to define the positions of the nodes and links
 *       in the workflowgraph graph
 */
@Injectable()
export class WorkflowGraphService {
  readonly nodeHeight = 22;
  // nodeWidth = 36;
  readonly nodeWidth = 48;

  // leave some space for the node border
  readonly nodeMinX = 2;
  readonly nodeMinY = 2;

  readonly phenodataRadius = this.nodeHeight / 2;
  readonly phenodataMargin = this.phenodataRadius;

  xMargin = this.nodeWidth / 4;
  yMargin = this.nodeHeight;

  constructor(private datasetService: DatasetService) {}

  newRootPosition(nodes: DatasetNode[]) {
    return this.newPosition(
      nodes,
      null,
      null,
      this.nodeWidth,
      this.nodeHeight * 2 + this.yMargin
    );
  }

  newPosition(
    nodes: DatasetNode[],
    parentX: number,
    parentY: number,
    width = this.nodeWidth,
    height = this.nodeHeight
  ) {
    let x = this.nodeMinX;
    let y = this.nodeMinY;

    if (parentX) {
      x = parentX;
    }
    if (parentY) {
      y = parentY + this.nodeHeight + this.yMargin;
    }

    while (this.intersectsAny(nodes, x, y, width, height)) {
      x += this.nodeWidth + this.xMargin;
    }

    return {
      x: x,
      y: y
    };
  }

  intersectsAny(
    nodes: DatasetNode[],
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    return nodes.some((node: DatasetNode) => {
      return this.intersectsNode(node, x, y, w, h);
    });
  }

  intersectsNode(
    node: DatasetNode,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    if (node.x && node.y) {
      const nodeWidth = this.datasetService.hasOwnPhenodata(node.dataset)
        ? this.nodeWidth + this.xMargin + this.nodeWidth
        : this.nodeWidth;
      return (
        x + w >= node.x &&
        x < node.x + nodeWidth &&
        y + h >= node.y &&
        y < node.y + this.nodeHeight
      );
    } else {
      return false;
    }
  }

  isOverLapping(rectA: any, rectB: any) {
    const rectAx = rectA.left;
    const rectAy = rectA.top;
    const rectAxMax = rectA.left + rectA.width;
    const rectAyMax = rectA.top + rectA.height;

    const rectBx = rectB.left;
    const rectBy = rectB.top;
    const rectBxMax = rectB.left + rectB.width;
    const rectByMax = rectB.top + rectB.height;

    const x_overlap = Math.max(
      0,
      Math.min(rectAxMax, rectBxMax) - Math.max(rectAx, rectBx)
    );
    const y_overlap = Math.max(
      0,
      Math.min(rectAyMax, rectByMax) - Math.max(rectAy, rectBy)
    );

    const overlap = x_overlap * y_overlap;
    if (overlap > 0) {
      return true;
    }

    return false;
  }

  isOverLappingWithCoord(
    topLeft: any,
    bottomRight: any,
    rectB: any,
    svgRect: any
  ) {
    const rectAx = topLeft[0] + svgRect.left;
    const rectAy = topLeft[1] + svgRect.top;
    const rectAxMax = bottomRight[0] + svgRect.left;
    const rectAyMax = bottomRight[1] + svgRect.top;

    const rectBx = rectB.left;
    const rectBy = rectB.top;
    const rectBxMax = rectB.left + rectB.width;
    const rectByMax = rectB.top + rectB.height;

    const x_overlap = Math.max(
      0,
      Math.min(rectAxMax, rectBxMax) - Math.max(rectAx, rectBx)
    );
    const y_overlap = Math.max(
      0,
      Math.min(rectAyMax, rectByMax) - Math.max(rectAy, rectBy)
    );

    const overlap = x_overlap * y_overlap;
    if (overlap > 0) {
      return true;
    }

    return false;
  }
}
