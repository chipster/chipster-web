var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import SelectionService from "../../selection.service";
import SessionDataService from "../../sessiondata.service";
import { Component } from "@angular/core";
export var JobComponent = (function () {
    function JobComponent(SelectionService, SessionDataService) {
        this.SelectionService = SelectionService;
        this.SessionDataService = SessionDataService;
    }
    JobComponent.prototype.deleteJobs = function () {
        this.SessionDataService.deleteJobs(this.SelectionService.selectedJobs);
    };
    JobComponent.prototype.getJob = function () {
        return this.SelectionService.selectedJobs[0];
    };
    JobComponent.prototype.isJobSelected = function () {
        return this.SelectionService.selectedJobs.length > 0;
    };
    JobComponent = __decorate([
        Component({
            selector: 'ch-job',
            templateUrl: './job.html'
        }), 
        __metadata('design:paramtypes', [SelectionService, SessionDataService])
    ], JobComponent);
    return JobComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/selectiondetails/job/job.component.js.map