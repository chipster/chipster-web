import Tool from "../../../../../model/session/tool";
import ToolResource from "../../../../../resources/toolresource";

SourceModalController.$inject = ['$log', '$uibModalInstance', 'selectedTool', 'ToolResource'];


function SourceModalController(
    $log: ng.ILogService,
    $uibModalInstance: any,
    selectedTool: Tool,
    ToolResource: ToolResource) {

    var self = this;

    this.selectedTool = selectedTool;

    this.$onInit = function () {
        ToolResource.service.one('tools', this.selectedTool.name.id).customGET('source').then(function (response: any) {
            $log.log(response.data);
            self.source = response.data;
        });
    };

    this.close = function () {
        $uibModalInstance.close();
    };
};

export default SourceModalController;