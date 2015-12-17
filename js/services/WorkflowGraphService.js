/**
 * @desc Service functions needed to define the positions of the nodes and links
 *       in the workflow graph
 */

chipsterWeb.factory('WorkflowGraphService', function() {
	// Drawing starts from 100,50 position of the SVG
	var stepX = 100, stepY = 50;

	return {

		calculateXPos : function(nodeIndex, level) {
			// For the uploaded input set,we consider index as cluster ID
			if (nodeIndex === 0)
				return 50; // return a default initial position for the 1st
							// node
			else
				return nodeIndex * 100;// this should be replaced with real
										// clusterID,still thinking how to
										// formalize that

		},

		calculateYPos : function(nodeIndex, level) {
			if (level === 0)
				return 50;
			else
				return level * 100 + nodeIndex * 50;
		}

	};

});