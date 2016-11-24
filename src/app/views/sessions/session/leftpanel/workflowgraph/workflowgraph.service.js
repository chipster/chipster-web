"use strict";
/**
 * @desc Service functions needed to define the positions of the nodes and links
 *       in the workflowgraph graph
 */
var WorkflowgraphService = (function () {
    function WorkflowgraphService() {
    }
    WorkflowgraphService.newRootPosition = function (nodes) {
        return WorkflowgraphService.newPosition(nodes, null, null);
    };
    WorkflowgraphService.newPosition = function (nodes, parentX, parentY) {
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
        };
    };
    WorkflowgraphService.intersectsAny = function (nodes, x, y, w, h) {
        return !nodes.every(function (node) {
            return !WorkflowgraphService.intersectsNode(node, x, y, w, h);
        });
    };
    WorkflowgraphService.intersectsNode = function (node, x, y, w, h) {
        return (x + w >= node.x &&
            x < node.x + WorkflowgraphService.nodeWidth &&
            y + h >= node.y &&
            y < node.y + WorkflowgraphService.nodeHeight);
    };
    return WorkflowgraphService;
}());
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @desc Service functions needed to define the positions of the nodes and links
 *       in the workflowgraph graph
 */
exports.default = WorkflowgraphService;
WorkflowgraphService.nodeHeight = 20;
WorkflowgraphService.nodeWidth = 32;
WorkflowgraphService.xMargin = WorkflowgraphService.nodeWidth / 4;
WorkflowgraphService.yMargin = WorkflowgraphService.nodeHeight;
//# sourceMappingURL=workflowgraph.service.js.map
