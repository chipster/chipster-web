import Node from "./node";
import { Injectable } from "@angular/core";
import { DatasetNodeToolTip } from "./data-node-tooltip";

/**
 * @desc Service functions needed to define the positions of the nodes and links
 *       in the workflowgraph graph
 */
@Injectable()
export class WorkflowGraphService {
  nodeHeight = 22;
  nodeWidth = 36;

  xMargin = this.nodeWidth / 2;
  yMargin = this.nodeHeight;

  newRootPosition(nodes: Node[]) {
    return this.newPosition(
      nodes,
      null,
      null,
      this.nodeHeight * 2 + this.yMargin
    );
  }

  newPosition(
    nodes: Node[],
    parentX: number,
    parentY: number,
    height = this.nodeHeight
  ) {
    let x = 10;
    let y = 10;

    if (parentX) {
      x = parentX;
    }
    if (parentY) {
      y = parentY + this.nodeHeight + this.yMargin;
    }

    while (this.intersectsAny(nodes, x, y, this.nodeWidth, height)) {
      x += this.nodeWidth + this.xMargin;
    }

    return {
      x: x,
      y: y
    };
  }

  intersectsAny(nodes: Node[], x: number, y: number, w: number, h: number) {
    return !nodes.every((node: Node) => {
      return !this.intersectsNode(node, x, y, w, h);
    });
  }

  intersectsNode(node: Node, x: number, y: number, w: number, h: number) {
    if (node.x && node.y) {
      return (
        x + w >= node.x &&
        x < node.x + this.nodeWidth &&
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

  const x_overlap = Math.max(0, Math.min(rectAxMax, rectBxMax) - Math.max(rectAx, rectBx));
  const y_overlap = Math.max(0, Math.min(rectAyMax, rectByMax) - Math.max(rectAy, rectBy));

  const overlap = x_overlap * y_overlap;
  if (overlap > 0 ) { return true; }

    return false;


 }

}
