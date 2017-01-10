import Node from "./node";

/**
 * @desc Service functions needed to define the positions of the nodes and links
 *       in the workflowgraph graph
 */
export default class WorkflowgraphService {

	static nodeHeight = 20;
	static nodeWidth = 32;

	static xMargin = WorkflowgraphService.nodeWidth / 4;
	static yMargin = WorkflowgraphService.nodeHeight;

	static newRootPosition(nodes: Node[]) {
		return WorkflowgraphService.newPosition(nodes, null, null);
	}

	static newPosition(nodes: Node[], parentX: number, parentY: number) {

		var x = 10;
		var y = 10;
		if (parentX) {
			x = parentX;
		}
		if (parentY) {
			y = parentY + WorkflowgraphService.nodeHeight + WorkflowgraphService.yMargin;
		}

		while (WorkflowgraphService.intersectsAny(nodes, x, y, WorkflowgraphService.nodeWidth, WorkflowgraphService.nodeHeight)) {
			x += WorkflowgraphService.nodeWidth + WorkflowgraphService.xMargin;
		}

		return {
			x: x,
			y: y
		}
	}

	static intersectsAny(nodes: Node[], x: number, y: number, w: number, h: number) {
		return !nodes.every(function(node) {
			return !WorkflowgraphService.intersectsNode(node, x, y, w, h);
		});
	}

	static intersectsNode(node: Node, x: number, y: number, w: number, h: number) {
		return (
			x + w >= node.x &&
			x < node.x + WorkflowgraphService.nodeWidth &&
			y + h >= node.y &&
			y < node.y + WorkflowgraphService.nodeHeight);
	}
}
