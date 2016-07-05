SourceModalController.$inject = ['$log', '$uibModalInstance', 'selectedTool', 'ToolRestangular'];


function SourceModalController($log, $uibModalInstance, selectedTool, ToolRestangular) {

    var self = this;

    this.selectedTool = selectedTool;

    this.$onInit = function () {
        ToolRestangular.one('tools', this.selectedTool.name.id).customGET('source').then(function (response) {
            $log.log(response.data);
            self.source = response.data;
        });
    };

    this.close = function () {
        $uibModalInstance.close();
    };
};

export default SourceModalController;