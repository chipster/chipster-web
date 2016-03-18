/**
 * @desc Service functions needed to define the positions of the nodes and links
 *       in the workflow graph
 */

chipsterWeb.factory('WorkflowGraphService', function() {

	var service = {

		nodeHeight: 25,
		nodeWidth: 40
	};

	service.xMargin = service.nodeWidth / 4;
	service.yMargin = service.nodeHeight;

	service.newRootPosition = function(nodes) {
		return service.newPosition(nodes, null, null);
	};

	service.newPosition = function(nodes, parentX, parentY) {

		var x = 10;
		var y = 10;
		if (parentX) {
			x = parentX;
		}
		if (parentY) {
			y = parentY + service.nodeHeight + service.yMargin;
		}

		while (service.intersectsAny(nodes, x, y)) {
			x += service.nodeWidth + service.xMargin;
		}

		return {
			x: x,
			y: y
		}
	};

	service.intersectsAny = function(nodes, x, y) {
		return !nodes.every(function(node) {
			return !service.intersectsNode(node, x, y);
		});
	};

	service.intersectsNode = function(node, x, y) {
		return (
			x >= node.x &&
			x < node.x + service.nodeWidth + service.xMargin &&
			y >= node.y &&
			y < node.y + service.nodeHeight + service.yMargin);
	};

	return service;
});