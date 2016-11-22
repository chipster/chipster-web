"use strict";
var DatasetBoxComponent = (function () {
    function DatasetBoxComponent(SelectionService, SessionDataService) {
        this.SelectionService = SelectionService;
        this.SessionDataService = SessionDataService;
    }
    DatasetBoxComponent.prototype.deleteDatasets = function () {
        this.onDelete();
    };
    DatasetBoxComponent.prototype.exportDatasets = function () {
        this.SessionDataService.exportDatasets(this.SelectionService.selectedDatasets);
    };
    DatasetBoxComponent.prototype.showHistory = function () {
        this.SessionDataService.openDatasetHistoryModal();
    };
    return DatasetBoxComponent;
}());
DatasetBoxComponent.$inject = ['SelectionService', 'SessionDataService'];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    templateUrl: 'app/views/sessions/session/dataset/dataset.html',
    controller: DatasetBoxComponent,
    bindings: {
        onDelete: '&'
    }
};
//# sourceMappingURL=datasetbox.component.js.map