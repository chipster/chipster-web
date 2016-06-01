
angular.module('chipster-web').controller('UploadDialogCtrl', function ($scope, $modal) {


  $scope.open = function () {

    var modalInstance = $modal.open({
      templateUrl:'myModalContent.html',
      windowTemplateUrl: '/app/partials/fileuploader.html',
      controller: 'ModalInstanceCtrl',
      resolve: {
					params: function(){
						return {
							title: 'File Uploader'
						};
					}
				}
    });
  };
});
