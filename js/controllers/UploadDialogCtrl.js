chipsterWeb.controller('UploadDialogCtrl', function ($scope, $modal) {


  $scope.open = function () {

    var modalInstance = $modal.open({
      templateUrl:'myModalContent.html',
      windowTemplateUrl: '/partials/fileuploader.html',
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

chipsterWeb.controller('ModalInstanceCtrl', function ($scope, $modalInstance, params) {

  
  $scope.title = 'File Uploader';
  
  $scope.ok = function () {
    $modalInstance.close('ok');
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});