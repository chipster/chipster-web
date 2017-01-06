
import Tool from "../../../../../model/session/tool";
import InputBinding from "../../../../../model/session/inputbinding";
import Dataset from "../../../../../model/session/dataset";
import JobParameter from "../../../../../model/session/jobparameter";
import {ToolService} from "../tool.service";
import ToolInput from "../../../../../model/session/toolinput";

ParameterModalController.$inject = ['$uibModalInstance', '$scope', 'selectedTool', 'inputBindings', 'selectedDatasets', 'ToolService', 'isRunEnabled', 'parameters'];

function ParameterModalController (
    $uibModalInstance: any,
    $scope: ng.IScope,
    selectedTool: Tool,
    inputBindings: InputBinding[],
    selectedDatasets: Dataset[],
    ToolService: ToolService,
    isRunEnabled: boolean,
    parameters: JobParameter[]) {

    var self = this;
    this.selectedTool = selectedTool;
    this.inputBindings = inputBindings;
    this.selectedDatasets = selectedDatasets;
    this.isRunEnabled = isRunEnabled;
    this.parameters = parameters;
    this.isSelectionParameter = ToolService.isSelectionParameter;
    this.isNumberParameter = ToolService.isNumberParameter;
    this.getDefaultValue = ToolService.getDefaultValue;

    this.getCompatibleDatasets = function (toolInput: ToolInput) {
        return this.selectedDatasets.filter(function (dataset: Dataset) {
            return ToolService.isCompatible(dataset, toolInput.type.name);
        });
    };
    this.showDescription = function (description: string) {
        this.description = description;
    };
    this.runJob = function () {
        this.close(true);
    };
    this.close = function (run: boolean) {
        $uibModalInstance.close({
            parameters: this.parameters,
            inputBindings: this.inputBindings,
            run: run
        });
    };
    this.dismiss = function () {
        $uibModalInstance.dismiss();
    };
    $scope.$on('modal.closing', function (event: any, reason: string, closed: boolean) {
        if (!closed) {
            event.preventDefault();
            self.close(false);
        }
    });
}

export default ParameterModalController;
