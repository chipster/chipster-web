var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from "@angular/core";
import WorkflowGraphService from "../../views/sessions/session/leftpanel/workflowgraph/workflowgraph.service";
import SessionResource from "../resources/session.resource";
import { TokenService } from "../../core/authentication/token.service";
import ConfigService from "./config.service";
import { Observable } from 'rxjs/Rx';
import Dataset from "../../model/session/dataset";
import Utils from "../utilities/utils";
var UploadService = (function () {
    function UploadService(ConfigService, tokenService, sessionResource, workflowGraphService) {
        this.ConfigService = ConfigService;
        this.tokenService = tokenService;
        this.sessionResource = sessionResource;
        this.workflowGraphService = workflowGraphService;
    }
    UploadService.prototype.getFlow = function (fileAdded, fileSuccess) {
        var _this = this;
        var flow = new Flow({
            // continuation from different browser session not implemented
            testChunks: false,
            method: 'octet',
            uploadMethod: 'PUT',
            // upload the chunks in order
            simultaneousUploads: 1,
            // don't spend time between requests too often
            chunkSize: 50000000,
            // accept 204 No content
            successStatuses: [200, 201, 202, 204],
            // fail on 409 Conflict
            permanentErrors: [404, 409, 415, 500, 501],
            // make numbers easier to read (default 500)
            progressCallbacksInterval: 1000,
            // manual's recommendation for big files
            speedSmoothingFactor: 0.02
        });
        if (!flow.support) {
            throw Error("flow.js not supported");
        }
        flow.on('fileAdded', function (file, event) {
            //console.log(file, event);
            _this.flowFileAdded(file, event, flow);
            fileAdded(file, event, flow);
        });
        flow.on('fileSuccess', function (file, message) {
            //console.log(file, message);
            fileSuccess(file);
        });
        flow.on('fileError', function (file, message) {
            console.log(file, message);
        });
        return flow;
    };
    UploadService.prototype.flowFileAdded = function (file, event, flow) {
        // each file has a unique target url
        flow.opts.target = function (file) {
            return file.chipsterTarget;
        };
        file.pause();
    };
    UploadService.prototype.startUpload = function (sessionId, file, datasetsMap) {
        var _this = this;
        Observable.forkJoin(this.ConfigService.getFileBrokerUrl(), this.createDataset(sessionId, file.name, datasetsMap)).subscribe(function (value) {
            var url = value[0];
            var dataset = value[1];
            file.chipsterTarget = url + "/sessions/" + sessionId + "/datasets/" + dataset.datasetId + "?token=" + _this.tokenService.getToken();
            file.chipsterSessionId = sessionId;
            file.chipsterDatasetId = dataset.datasetId;
            file.resume();
        });
    };
    UploadService.prototype.createDataset = function (sessionId, name, datasetsMap) {
        var _this = this;
        var d = new Dataset(name);
        return this.sessionResource.createDataset(sessionId, d).map(function (datasetId) {
            d.datasetId = datasetId;
            if (datasetsMap) {
                var pos = _this.workflowGraphService.newRootPosition(Utils.mapValues(datasetsMap));
                d.x = pos.x;
                d.y = pos.y;
            }
            _this.sessionResource.updateDataset(sessionId, d);
            return d;
        });
    };
    /**
     * We have to poll the upload progress, because flow.js doesn't send events about it.
     *
     * Schedule a next view update after a second as long as flow.js has files.
     */
    UploadService.prototype.scheduleViewUpdate = function (changeDetectorRef, flow) {
        var _this = this;
        Observable.timer(1000).subscribe(function () {
            changeDetectorRef.detectChanges();
            if (flow.files.length > 0) {
                _this.scheduleViewUpdate(changeDetectorRef, flow);
            }
        });
    };
    UploadService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [ConfigService, TokenService, SessionResource, WorkflowGraphService])
    ], UploadService);
    return UploadService;
}());
export default UploadService;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/services/upload.service.js.map