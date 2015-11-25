/**
 * @desc Tool controller for controlling tool json requests and load the tool
 *       data in UI
 * @example <div ng-controller="ToolCtrl"></div>
 */
chipsterWeb.controller('ToolCtrl', function($scope, $q, ToolRestangular) {
	// for the time being,tools have a different URL
	
	//initialization
	$scope.activeTab=0;//defines which tab is displayed as active tab in the beginning
	$scope.selected_t_cat_index = -1;
	$scope.current_t_cat = null;
	$scope.is_t_type_selected=false;
	$scope.selected_t_type_index=-1;
	
	$scope.getTools = function() {
		var promises = [ ToolRestangular.all('modules.json').getList(),
				ToolRestangular.all('tools.json').getList() ];
		$q.all(promises).then(function(response) {
			$scope.t_modules = response[0].data;
			$scope.t_detail_list = response[1].data;
			$scope.t_categories=$scope.t_modules[$scope.activeTab].categories;
		});
	};
	
	
	$scope.setTab=function($index){
		$scope.activeTab=$index;
		$scope.t_categories=$scope.t_modules[$index].categories;
		console.log($scope.t_categories);
	};
	
	$scope.isSet=function($index){
		return $scope.activeTab === $index;
	};
	
	//defines which tool category the user have selected
	$scope.selected_t_category = function(t_cat, $index) {
		$scope.selected_t_cat_index = $index;
		$scope.current_t_cat= t_cat;
		console.log($scope.selectedToolCatIndex);
	};
	
	$scope.selected_tool_type = function(tool,$index) {
		$scope.selected_t_type = tool;
		$scope.selected_t_type_index = $index;
		$scope.is_t_type_selected= true;
		console.log($scope.selected_t_type);
		
		//find the relevant description
		
		angular.forEach($scope.t_detail_list, function(elem, index) {
			if(elem.name.id===tool.id){
				$scope.selected_t_des=elem.description;
				console.log($scope.selected_t_des);
			}
			
		});
		
		
	};

});