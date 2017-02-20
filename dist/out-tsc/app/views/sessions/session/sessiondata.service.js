var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import SessionResource from "../../../shared/resources/session.resource";
import ConfigService from "../../../shared/services/config.service";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import JobInput from "../../../model/session/jobinput";
import FileResource from "../../../shared/resources/fileresource";
import { Injectable } from "@angular/core";
import { TokenService } from "../../../core/authentication/token.service";
import { Observable } from "rxjs";
var SessionDataService = (function () {
    function SessionDataService(sessionResource, configService, tokenService, fileResource) {
        this.sessionResource = sessionResource;
        this.configService = configService;
        this.tokenService = tokenService;
        this.fileResource = fileResource;
    }
    SessionDataService.prototype.getSessionId = function () {
        return this.sessionId;
    };
    SessionDataService.prototype.setSessionId = function (id) {
        this.sessionId = id;
    };
    SessionDataService.prototype.createDataset = function (dataset) {
        return this.sessionResource.createDataset(this.getSessionId(), dataset);
    };
    SessionDataService.prototype.createJob = function (job) {
        return this.sessionResource.createJob(this.getSessionId(), job);
    };
    SessionDataService.prototype.getJobById = function (jobId, jobs) {
        return jobs.get(jobId);
    };
    /**
     * Create a dataset which is derived from some other datasets.
     *
     * The file content is uploaded to the server and a fake job is created, so
     * that the datasets' relationships are shown correctly in the workflowgraph graph.
     *
     * @param name Name of the new dataset
     * @param sourceDatasetIds Array of datasetIds shown as inputs for the new dataset
     * @param toolName e.g. name of the visualization that created this dataset
     * @param content File content, the actual data
     * @returns Promise which resolves when all this is done
     */
    SessionDataService.prototype.createDerivedDataset = function (name, sourceDatasetIds, toolName, content) {
        var _this = this;
        var d = new Dataset(name);
        return this.createDataset(d).flatMap(function (datasetId) {
            d.datasetId = datasetId;
            var job = new Job();
            job.state = "COMPLETED";
            job.toolCategory = "Interactive visualizations";
            job.toolName = toolName;
            job.inputs = sourceDatasetIds.map(function (id) {
                var input = new JobInput();
                input.datasetId = id;
                return input;
            });
            return _this.createJob(job);
        }).flatMap(function (jobId) {
            // d.datasetId is already set above
            d.sourceJob = jobId;
            return _this.updateDataset(d);
        }).flatMap(function () {
            return _this.fileResource.uploadData(_this.getSessionId(), d.datasetId, content);
        }).catch(function (err) {
            console.log('create derived dataset failed', err);
            throw err;
        });
    };
    SessionDataService.prototype.deleteJobs = function (jobs) {
        var _this = this;
        var deleteJobs$ = jobs.map(function (job) { return _this.sessionResource.deleteJob(_this.getSessionId(), job.jobId); });
        Observable.merge.apply(Observable, deleteJobs$).subscribe(function (res) {
            console.info('Job deleted', res);
        });
    };
    SessionDataService.prototype.deleteDatasets = function (datasets) {
        var _this = this;
        var deleteDatasets$ = datasets.map(function (dataset) { return _this.sessionResource.deleteDataset(_this.getSessionId(), dataset.datasetId); });
        Observable.merge.apply(Observable, deleteDatasets$).subscribe(function (res) {
            console.info('Job deleted', res);
        });
    };
    SessionDataService.prototype.updateDataset = function (dataset) {
        return this.sessionResource.updateDataset(this.getSessionId(), dataset).toPromise();
    };
    SessionDataService.prototype.updateSession = function (session) {
        return this.sessionResource.updateSession(session);
    };
    SessionDataService.prototype.getDatasetUrl = function (dataset) {
        var _this = this;
        return this.configService.getFileBrokerUrl().map(function (url) {
            return (url + "/sessions/" + _this.getSessionId() + "/datasets/" + dataset.datasetId + "?token=" + _this.tokenService.getToken());
        });
    };
    SessionDataService.prototype.exportDatasets = function (datasets) {
        var _this = this;
        for (var _i = 0, datasets_1 = datasets; _i < datasets_1.length; _i++) {
            var d = datasets_1[_i];
            this.getDatasetUrl(d).subscribe(function (url) {
                _this.download(url + '&download');
            });
        }
    };
    SessionDataService.prototype.download = function (url) {
        window.open(url, "_blank");
    };
    SessionDataService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [SessionResource, ConfigService, TokenService, FileResource])
    ], SessionDataService);
    return SessionDataService;
}());
export default SessionDataService;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/sessiondata.service.js.map