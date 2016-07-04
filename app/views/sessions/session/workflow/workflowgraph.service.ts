/**
 * @desc Service functions needed to define the positions of the nodes and links
 *       in the workflow graph
 */

export default function() {

	var service = {

		nodeHeight: 20,
		nodeWidth: 32
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

		while (service.intersectsAny(nodes, x, y, service.nodeWidth, service.nodeHeight)) {
			x += service.nodeWidth + service.xMargin;
		}

		return {
			x: x,
			y: y
		}
	};

	service.intersectsAny = function(nodes, x, y, w, h) {
		return !nodes.every(function(node) {
			return !service.intersectsNode(node, x, y, w, h);
		});
	};

	service.intersectsNode = function(node, x, y, w, h) {
		return (
			x + w >= node.x &&
			x < node.x + service.nodeWidth &&
			y + h >= node.y &&
			y < node.y + service.nodeHeight);
	};

	return service;
};