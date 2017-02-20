var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import SessionEventService from "./sessionevent.service";
import SessionDataService from "./sessiondata.service";
import SelectionService from "./selection.service";
import * as _ from "lodash";
import WsEvent from "../../../model/events/wsevent";
import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
export var SessionComponent = (function () {
    function SessionComponent(router, SessionEventService, sessionDataService, selectionService, route) {
        this.router = router;
        this.SessionEventService = SessionEventService;
        this.sessionDataService = sessionDataService;
        this.selectionService = selectionService;
        this.route = route;
        this.toolDetailList = null;
    }
    SessionComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.sessionData = this.route.snapshot.data['sessionData'];
        // Services don't have access to ActivatedRoute, so we have to set it
        this.sessionDataService.setSessionId(this.route.snapshot.params['sessionId']);
        // start listening for remote changes
        // in theory we may miss an update between the loadSession() and this subscribe(), but
        // the safe way would be much more complicated:
        // - subscribe but put the updates in queue
        // - loadSession().then()
        // - apply the queued updates
        this.SessionEventService.setSessionData(this.sessionDataService.getSessionId(), this.sessionData);
        this.SessionEventService.getAuthorizationStream().subscribe(function (change) {
            if (change.event.type === 'DELETE') {
                alert('The session has been deleted.');
                _this.router.navigate(['/sessions']);
            }
        });
        this.SessionEventService.getJobStream().subscribe(function (change) {
            var oldValue = change.oldValue;
            var newValue = change.newValue;
            // if not cancelled
            if (newValue) {
                // if the job has just failed
                if (newValue.state === 'FAILED' && oldValue.state !== 'FAILED') {
                    _this.openErrorModal('Job failed', newValue);
                    console.info(newValue);
                }
                if (newValue.state === 'ERROR' && oldValue.state !== 'ERROR') {
                    _this.openErrorModal('Job error', newValue);
                    console.info(newValue);
                }
            }
        });
    };
    SessionComponent.prototype.ngOnDestroy = function () {
        this.SessionEventService.unsubscribe();
    };
    SessionComponent.prototype.getSelectedDatasets = function () {
        return this.selectionService.selectedDatasets;
    };
    SessionComponent.prototype.getSelectedJobs = function () {
        return this.selectionService.selectedJobs;
    };
    SessionComponent.prototype.getJob = function (jobId) {
        return this.sessionData.jobsMap.get(jobId);
    };
    SessionComponent.prototype.deleteJobs = function (jobs) {
        this.sessionDataService.deleteJobs(jobs);
    };
    SessionComponent.prototype.deleteDatasetsNow = function () {
        // cancel the timer
        clearTimeout(this.deletedDatasetsTimeout);
        // delete from the server
        this.sessionDataService.deleteDatasets(this.deletedDatasets);
        // hide the undo message
        this.deletedDatasets = null;
    };
    SessionComponent.prototype.deleteDatasetsUndo = function () {
        var _this = this;
        // cancel the deletion
        clearTimeout(this.deletedDatasetsTimeout);
        // show datasets again in the workflowgraph
        this.deletedDatasets.forEach(function (dataset) {
            var wsEvent = new WsEvent(_this.sessionDataService.getSessionId(), 'DATASET', dataset.datasetId, 'CREATE');
            _this.SessionEventService.generateLocalEvent(wsEvent);
        });
        // hide the undo message
        this.deletedDatasets = null;
    };
    /**
     * Poor man's undo for the dataset deletion.
     *
     * Hide the dataset from the client for ten
     * seconds and delete from the server only after that. deleteDatasetsUndo() will
     * cancel the timer and make the datasets visible again. Session copying and sharing
     * should filter out these hidden datasets or we need a proper server side support for this.
     */
    SessionComponent.prototype.deleteDatasetsLater = function () {
        var _this = this;
        // make a copy so that further selection changes won't change the array
        this.deletedDatasets = _.clone(this.selectionService.selectedDatasets);
        // hide from the workflowgraph
        this.deletedDatasets.forEach(function (dataset) {
            var wsEvent = new WsEvent(_this.sessionDataService.getSessionId(), 'DATASET', dataset.datasetId, 'DELETE');
            _this.SessionEventService.generateLocalEvent(wsEvent);
        });
        // start timer to delete datasets from the server later
        this.deletedDatasetsTimeout = setTimeout(function () {
            _this.deleteDatasetsNow();
        }, 10 * 1000);
    };
    SessionComponent.prototype.exportDatasets = function (datasets) {
        this.sessionDataService.exportDatasets(datasets);
    };
    SessionComponent.prototype.getSession = function () {
        return this.sessionData.session;
    };
    SessionComponent.prototype.getDatasetsMap = function () {
        return this.sessionData.datasetsMap;
    };
    SessionComponent.prototype.getJobsMap = function () {
        return this.sessionData.jobsMap;
    };
    SessionComponent.prototype.getModulesMap = function () {
        return this.sessionData.modulesMap;
    };
    SessionComponent.prototype.openErrorModal = function (title, job) {
        // this.$uibModal.open({
        //       animation: true,
        //       templateUrl: './joberrormodal/joberrormodal.html',
        //       controller: 'JobErrorModalController',
        //       controllerAs: 'vm',
        //       bindToController: true,
        //       size: 'lg',
        //       resolve: {
        //           toolErrorTitle: () => {
        //               return _.cloneDeep(title);
        //           },
        //           toolError: () => {
        //               TODO pass on the job and show only relevant fields
        // return _.cloneDeep(JSON.stringify(job, null, 2)); // 2 for pretty print
        // }
        // }
        // });
    };
    SessionComponent = __decorate([
        Component({
            selector: 'ch-session',
            templateUrl: './session.component.html'
        }), 
        __metadata('design:paramtypes', [Router, SessionEventService, SessionDataService, SelectionService, ActivatedRoute])
    ], SessionComponent);
    return SessionComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/session.component.js.map