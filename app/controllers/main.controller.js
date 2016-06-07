
angular.module('chipster-web').controller('MainCtrl', function($scope, $location,SessionRestangular, ConfigService){


	$scope.getHost = function () {
		return ConfigService.getApiUrl();
	};

	$scope.setTitle = function (title, renameEnabled) {
		$scope.title = title;
		$scope.isTitleRenameEnabled = renameEnabled;
	};

});