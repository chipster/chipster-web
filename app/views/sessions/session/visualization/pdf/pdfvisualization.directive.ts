
export default function(){
    return{
        restrict:'E',
        scope : {
            datasetId: "=",
            sessionId: "=",
            src: "="
        },
        template: '<div class="wrapper scrollable"><ng-pdf template-url="views/sessions/session/visualization/pdf/viewer.html" scale="page-fit"></ng-pdf></div>',
        link: function ($scope: ng.IScope) {

            //blocks for the visualization controlling
            $scope.pdfFileName='PDF file';//name of the pdf result file to view
            $scope.pdfUrl=$scope.src;
            $scope.scroll=0;
            $scope.loading='loading';

            $scope.getNavStyle=function(scroll: number){
                if(scroll>100) return 'pdf-controls fixed';
                else return 'pdf-controls';

            };

            $scope.onError=function(error: any){
                console.log(error);
            };

            $scope.onLoad=function(){
                $scope.loading='';
            };

            $scope.onProgress=function(progress: number){

            };
        }
    };
};