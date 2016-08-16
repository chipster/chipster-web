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
        ToolResource.getSourceCode(this.selectedTool.name.id).then((sourceCode) => {
            $log.log(sourceCode);
            self.source = sourceCode;
        });
    };

    this.close = function () {
        $uibModalInstance.close();
    };
}

export default SourceModalController;