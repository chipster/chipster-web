import Node from "./node";
import {Injectable} from "@angular/core";

/**
 * @desc Service functions needed to define the positions of the nodes and links
 *       in the workflowgraph graph
 */
@Injectable()
export default class WorkflowGraphService {

	nodeHeight = 20;
	nodeWidth = 32;

	xMargin = this.nodeWidth / 4;
	yMargin = this.nodeHeight;

	newRootPosition(nodes: Node[]) {
		return this.newPosition(nodes, null, null);
	}

	newPosition(nodes: Node[], parentX: number, parentY: number) {

		var x = 10;
		var y = 10;
		if (parentX) {
			x = parentX;
		}
		if (parentY) {
			y = parentY + this.nodeHeight + this.yMargin;
		}

		while (this.intersectsAny(nodes, x, y, this.nodeWidth, this.nodeHeight)) {
			x += this.nodeWidth + this.xMargin;
		}

		return {
			x: x,
			y: y
		}
	}

	intersectsAny(nodes: Node[], x: number, y: number, w: number, h: number) {
		return !nodes.every((node: Node) => {
			return !this.intersectsNode(node, x, y, w, h);
		});
	}

	intersectsNode(node: Node, x: number, y: number, w: number, h: number) {
		return (
			x + w >= node.x &&
			x < node.x + this.nodeWidth &&
			y + h >= node.y &&
			y < node.y + this.nodeHeight);
	}
}
