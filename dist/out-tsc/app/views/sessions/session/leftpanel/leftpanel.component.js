var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import SessionDataService from "../sessiondata.service";
import UtilsService from "../../../../shared/utilities/utils";
import SessionResource from "../../../../shared/resources/session.resource";
import SelectionService from "../selection.service";
import { SessionWorkerResource } from "../../../../shared/resources/sessionworker.resource";
import { SessionData } from "../../../../model/session/session-data";
import SessionEventService from "../sessionevent.service";
import { Component, Input } from "@angular/core";
export var LeftPanelComponent = (function () {
    function LeftPanelComponent(sessionResource, sessionDataService, sessionEventService, selectionService, sessionWorkerResource) {
        this.sessionResource = sessionResource;
        this.sessionDataService = sessionDataService;
        this.sessionEventService = sessionEventService;
        this.selectionService = selectionService;
        this.sessionWorkerResource = sessionWorkerResource;
        this.isCopying = false;
    }
    LeftPanelComponent.prototype.ngOnInit = function () {
        this.sessionEventService.getSessionStream().subscribe(function () {
            // someone else has updated the session notes or the session name, show it
            // this.$scope.$apply();
        });
    };
    LeftPanelComponent.prototype.datasetSearchKeyEvent = function (e) {
        if (e.keyCode == 13) {
            // select highlighted datasets
            var allDatasets = this.getDatasetList();
            // TODO - fix: commented out on angular2 upgrade
            // this.selectionService.setSelectedDatasets(IChipsterFilter['searchDatasetFilter'](allDatasets, this.datasetSearch));
            this.datasetSearch = null;
        }
        if (e.keyCode == 27) {
            // clear the search
            this.datasetSearch = null;
        }
    };
    LeftPanelComponent.prototype.isSelectedDataset = function (dataset) {
        return this.selectionService.isSelectedDataset(dataset);
    };
    LeftPanelComponent.prototype.getDatasetList = function () {
        return UtilsService.mapValues(this.sessionData.datasetsMap);
    };
    LeftPanelComponent.prototype.downloadSession = function () {
        var _this = this;
        this.sessionWorkerResource.getPackageUrl(this.sessionDataService.getSessionId()).subscribe(function (url) {
            _this.sessionDataService.download(url);
        });
    };
    LeftPanelComponent.prototype.toggleDatasetSelection = function ($event, data) {
        this.selectionService.toggleDatasetSelection($event, data, UtilsService.mapValues(this.sessionData.datasetsMap));
    };
    LeftPanelComponent.prototype.openCopySessionModal = function () {
        // var modalInstance = this.getSessionEditModal('Copy session', this.sessionData.session.name + '_copy');
        //
        //
        // modalInstance.result.then( (result: string) => {
        //   if (!result) {
        //     result = 'unnamed session';
        //   }
        //   this.isCopying = true;
        //   const sessionCopy$ = this.sessionResource.copySession(this.sessionData, result);
        //   sessionCopy$.subscribe(() => {
        //     this.isCopying = false;
        //   })
        // }, function () {
        //   modal dismissed
        // });
    };
    __decorate([
        Input(), 
        __metadata('design:type', SessionData)
    ], LeftPanelComponent.prototype, "sessionData", void 0);
    LeftPanelComponent = __decorate([
        Component({
            selector: 'ch-leftpanel',
            templateUrl: './leftpanel.component.html'
        }), 
        __metadata('design:paramtypes', [SessionResource, SessionDataService, SessionEventService, SelectionService, SessionWorkerResource])
    ], LeftPanelComponent);
    return LeftPanelComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/leftpanel/leftpanel.component.js.map