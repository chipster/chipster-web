angular.module('chipster-web').controller('ToolSourceModalController',
    function ($log, $uibModalInstance, selectedTool, ToolRestangular) {

    var self = this;

    this.selectedTool = selectedTool;

    ToolRestangular.one('tools', this.selectedTool.name.id).customGET('source').then(function(response) {
        $log.log(response.data);
        self.source = response.data;
    });

    this.close = function () {
        $uibModalInstance.close();
    };
});