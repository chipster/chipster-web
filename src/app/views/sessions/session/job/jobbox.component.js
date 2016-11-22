"use strict";
var JobBoxComponent = (function () {
    function JobBoxComponent(SelectionService, SessionDataService) {
        this.SelectionService = SelectionService;
        this.SessionDataService = SessionDataService;
    }
    JobBoxComponent.prototype.deleteJobs = function () {
        this.SessionDataService.deleteJobs(this.SelectionService.selectedJobs);
    };
    JobBoxComponent.prototype.getSelectionService = function () {
        return this.SelectionService;
    };
    JobBoxComponent.prototype.getJob = function () {
        return this.SelectionService.selectedJobs[0];
    };
    JobBoxComponent.prototype.isJobSelected = function () {
        return this.SelectionService.selectedJobs.length > 0;
    };
    return JobBoxComponent;
}());
JobBoxComponent.$inject = ['SelectionService', 'SessionDataService'];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    templateUrl: 'app/views/sessions/session/job/job.html',
    controller: JobBoxComponent
};
//# sourceMappingURL=jobbox.component.js.map