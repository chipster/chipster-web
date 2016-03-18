/**
 * @desc Service functions needed to define the positions of the nodes and links
 *       in the workflow graph
 */

chipsterWeb.factory('WorkflowGraphService', function(TemplateService) {
	// Drawing starts from 100,50 position of the SVG
	var initValue = 30;
	return {

		calculateXPos : function(nodeIndex) {
			// For the uploaded input set,we consider index as cluster ID
			if (nodeIndex === 0)
				return initValue; // return a default initial position for the
			// 1st
			// node
			else
				return nodeIndex * 70 + initValue;// this should be replaced
			// with real
			// clusterID,still thinking how to
			// formalize that

		},

		calculateYPos : function(nodeIndex, level) {
			if (level === 0)
				return 50;
			else
				return level * 100;
		},

		sortByPosition : function(inputset, key) {
			return inputset.sort(function(obj1, obj2) {
				var i = obj1[key];
				var j = obj2[key];
				return ((i < j) ? -1 : ((i > j) ? 1 : 0));
			});
		},

		getProgressNode : function(inputset) {
			var self = this;
			// depending on input datasets position on the graph,we need to
			// calculate the progressNode's relative position
			var progressNode = TemplateService.getDatasetTemplate();
			progressNode.index=1000;//some hypothetical id 

			var length = inputset.length;
			if (length > 1) {
				var sortedInputSetByX = self.sortByPosition(inputset, 'x');
				console.log(sortedInputSetByX);
				var sortedInputSetByY = self.sortByPosition(inputset, 'y');
				console.log(sortedInputSetByY);
				progressNode.x = sortedInputSetByX[0].x+ sortedInputSetByX[length - 1].x / 2;
				progressNode.y = sortedInputSetByY[length - 1].y + 100;
			} else {
				progressNode.x = inputset[0].x;
				progressNode.y = inputset[0].y + 100;

			}

			console.log(progressNode);

			return progressNode;
		},

		createDummyLinks : function(inputset, progressNode) {
			var dummyLinks = [];
			
			angular.forEach(inputset, function(elem, index) {
				dummyLinks.push({
					source : index,
					target : progressNode.index,
					value : 1

				});
			});
			console.log(dummyLinks);
			return dummyLinks;

		}
	}
});