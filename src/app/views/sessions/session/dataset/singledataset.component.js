"use strict";
var SingleDataset = (function () {
    function SingleDataset(sessionDataService, selectionService) {
        this.sessionDataService = sessionDataService;
        this.selectionService = selectionService;
    }
    SingleDataset.prototype.$onInit = function () {
        this.sourceJob = this.getSourceJob(this.dataset);
    };
    SingleDataset.prototype.$onChanges = function (changes) {
        this.dataset = changes.dataset.currentValue;
        this.sourceJob = this.getSourceJob(this.dataset);
    };
    SingleDataset.prototype.renameDataset = function () {
        this.sessionDataService.renameDatasetDialog(this.dataset);
    };
    SingleDataset.prototype.deleteDatasets = function () {
        this.onDelete();
    };
    SingleDataset.prototype.exportDatasets = function () {
        this.sessionDataService.exportDatasets([this.dataset]);
    };
    SingleDataset.prototype.showHistory = function () {
        this.sessionDataService.openDatasetHistoryModal();
    };
    SingleDataset.prototype.getSourceJob = function (dataset) {
        return this.sessionDataService.getJobById(dataset.sourceJob, this.jobs);
    };
    return SingleDataset;
}());
SingleDataset.$inject = ['SessionDataService', 'SelectionService'];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    bindings: {
        dataset: '<',
        jobs: '<',
        onDelete: '&'
    },
    controller: SingleDataset,
    templateUrl: 'app/views/sessions/session/dataset/singledataset.html'
};
//# sourceMappingURL=singledataset.component.js.map