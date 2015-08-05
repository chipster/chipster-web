//Controller for different toolse
chipsterWeb.controller('AnalysisToolTabCtrl', function($scope,$http){

		this.tab = 1;

        this.setTab = function (activeTab) {
            this.tab = activeTab;
            console.log('tab clicked');

        };

        this.isSet = function (checkTab) {
            return this.tab === checkTab;
        };


	

});