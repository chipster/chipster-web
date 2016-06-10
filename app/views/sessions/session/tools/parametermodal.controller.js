angular.module('chipster-web').controller('ParameterModalController',
    function ($log, $uibModalInstance, $scope, selectedTool, inputBindings, selectedDatasets, ToolService, isRunEnabled, parameters) {

    var self = this;

    this.selectedTool = selectedTool;
    this.inputBindings = inputBindings;
    this.selectedDatasets = selectedDatasets;
    this.isRunEnabled = isRunEnabled;
    this.parameters = parameters;

    this.isSelectionParameter = ToolService.isSelectionParameter;
    this.isNumberParameter = ToolService.isNumberParameter;
    this.getDefaultValue = ToolService.getDefaultValue;

    // used in an Angular expression in parametermodal.html (WebStorm won't find it)
    this.getCompatibleDatasets = function (toolInput) {
        return this.selectedDatasets.filter( function (dataset) {
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

    /*
    We want to save the settings, but closing the modal with a background click dismisses it,
    which rejects the promise and won't allow the modal to return anything.
     */

    // listen for modal closing
    $scope.$on('modal.closing', function (event, reason, closed) {
        // if the modal was dismissed
        if (!closed) {
            // prevent it
            event.preventDefault();
            // and close the modal and return a result to save the settings
            self.close(false);
        }
    });
});