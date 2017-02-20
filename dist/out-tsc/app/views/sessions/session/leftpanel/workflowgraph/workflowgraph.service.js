var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from "@angular/core";
/**
 * @desc Service functions needed to define the positions of the nodes and links
 *       in the workflowgraph graph
 */
var WorkflowGraphService = (function () {
    function WorkflowGraphService() {
        this.nodeHeight = 20;
        this.nodeWidth = 32;
        this.xMargin = this.nodeWidth / 4;
        this.yMargin = this.nodeHeight;
    }
    WorkflowGraphService.prototype.newRootPosition = function (nodes) {
        return this.newPosition(nodes, null, null);
    };
    WorkflowGraphService.prototype.newPosition = function (nodes, parentX, parentY) {
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
        };
    };
    WorkflowGraphService.prototype.intersectsAny = function (nodes, x, y, w, h) {
        var _this = this;
        return !nodes.every(function (node) {
            return !_this.intersectsNode(node, x, y, w, h);
        });
    };
    WorkflowGraphService.prototype.intersectsNode = function (node, x, y, w, h) {
        return (x + w >= node.x &&
            x < node.x + this.nodeWidth &&
            y + h >= node.y &&
            y < node.y + this.nodeHeight);
    };
    WorkflowGraphService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [])
    ], WorkflowGraphService);
    return WorkflowGraphService;
}());
export default WorkflowGraphService;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/leftpanel/workflowgraph/workflowgraph.service.js.map