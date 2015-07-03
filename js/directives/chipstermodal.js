chipsterWeb.directive('chipsterModal',function($modal){

	//defining the view template directories
	var templateDir='partials/'

	return{
		transclude:true,
		restrict:'EA',
		template: '<a ng-click="open()" ng-transclude>{{name}}</a>',
		scope:{
			useCtrl:"@"
		},

		link:function(scope,element,attrs){
			console.log('Attrs:', attrs);

			scope.open=function(){
				var modalInstance=$modal.open({
					templateUrl:'partials/fileuploader.html',
					controller:scope.useCtrl,
					size:'lg',
					windowClass:'app-modal-window',
					backdrop:true,
					resolve:{
						checkModal:function(){
							console.log('Modal is working');
						}
					}

				});

				modalInstance.result.then(function(){
					console.log('Finished');
				}, function(){
					console.log('Modal Dismissed');
				});

			};
		}

	};

});

