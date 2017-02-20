ParameterModalController.$inject = ['$uibModalInstance', '$scope', 'selectedTool', 'inputBindings', 'selectedDatasets', 'ToolService', 'isRunEnabled', 'parameters'];
function ParameterModalController($uibModalInstance, $scope, selectedTool, inputBindings, selectedDatasets, ToolService, isRunEnabled, parameters) {
    var self = this;
    this.selectedTool = selectedTool;
    this.inputBindings = inputBindings;
    this.selectedDatasets = selectedDatasets;
    this.isRunEnabled = isRunEnabled;
    this.parameters = parameters;
    this.isSelectionParameter = ToolService.isSelectionParameter;
    this.isNumberParameter = ToolService.isNumberParameter;
    this.getDefaultValue = ToolService.getDefaultValue;
    this.getCompatibleDatasets = function (toolInput) {
        return this.selectedDatasets.filter(function (dataset) {
            return ToolService.isCompatible(dataset, toolInput.type.name);
        });
    };
    this.showDescription = function (description) {
        this.description = description;
    };
    this.runJob = function () {
        this.close(true);
    };
    this.close = function (run) {
        $uibModalInstance.close({
            parameters: this.parameters,
            inputBindings: this.inputBindings,
            run: run
        });
    };
    this.dismiss = function () {
        $uibModalInstance.dismiss();
    };
    $scope.$on('modal.closing', function (event, reason, closed) {
        if (!closed) {
            event.preventDefault();
            self.close(false);
        }
    });
}
export default ParameterModalController;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/tools/parametermodal/parametermodal.controller.js.map