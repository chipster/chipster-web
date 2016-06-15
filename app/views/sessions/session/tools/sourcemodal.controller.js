angular.module('chipster-web').controller('SourceModalController',
    function ($log, $uibModalInstance, selectedTool, ToolRestangular) {

    var self = this;

    this.selectedTool = selectedTool;

    this.$onInit = function () {
        ToolRestangular.one('tools', this.selectedTool.name.id).customGET('source').then(function(response) {
            $log.log(response.data);
            self.source = response.data;
        });
    };

    this.close = function () {
        $uibModalInstance.close();
    };
});