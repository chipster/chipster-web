var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import ConfigService from "../services/config.service";
import { ToolResource } from "./toolresource";
import * as _ from "lodash";
import UtilsService from "../utilities/utils";
import { Injectable } from "@angular/core";
import { SessionData } from "../../model/session/session-data";
import { RestService } from "../../core/rest-services/restservice/rest.service";
import { Observable } from "rxjs";
var SessionResource = (function () {
    function SessionResource(configService, toolResource, restService) {
        this.configService = configService;
        this.toolResource = toolResource;
        this.restService = restService;
    }
    SessionResource.prototype.loadSession = function (sessionId) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) {
            var session$ = _this.restService.get(url + "/sessions/" + sessionId, true);
            var sessionDatasets$ = _this.restService.get(url + "/sessions/" + sessionId + "/datasets", true);
            var sessionJobs$ = _this.restService.get(url + "/sessions/" + sessionId + "/jobs", true);
            var modules$ = _this.toolResource.getModules();
            var tools$ = _this.toolResource.getTools();
            return Observable.forkJoin([session$, sessionDatasets$, sessionJobs$, modules$, tools$]);
        }).map(function (param) {
            var session = param[0];
            var datasets = param[1];
            var jobs = param[2];
            var modules = param[3];
            var tools = param[4];
            // is there any less ugly syntax for defining the types of anonymous object?
            var data = new SessionData();
            data.session = session;
            data.datasetsMap = UtilsService.arrayToMap(datasets, 'datasetId');
            data.jobsMap = UtilsService.arrayToMap(jobs, 'jobId');
            // show only configured modules
            modules = modules.filter(function (module) { return _this.configService.getModules().indexOf(module.name) >= 0; });
            data.modules = modules;
            data.tools = tools;
            // build maps for modules and categories
            // generate moduleIds
            modules.map(function (module) {
                module.moduleId = module.name.toLowerCase();
                return module;
            });
            data.modulesMap = UtilsService.arrayToMap(modules, 'moduleId');
            data.modulesMap.forEach(function (module) {
                module.categoriesMap = UtilsService.arrayToMap(module.categories, 'name');
            });
            return data;
        });
    };
    SessionResource.prototype.getSessions = function () {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.get(url + "/sessions", true); });
    };
    SessionResource.prototype.createSession = function (session) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.post(url + "/sessions/", session, true); })
            .map(function (response) { return response.sessionId; });
    };
    SessionResource.prototype.createDataset = function (sessionId, dataset) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.post(url + "/sessions/" + sessionId + "/datasets", dataset, true); })
            .map(function (response) { return response.datasetId; });
    };
    SessionResource.prototype.createJob = function (sessionId, job) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.post(url + "/sessions/" + sessionId + "/jobs", job, true); })
            .map(function (response) { return response.jobId; });
    };
    SessionResource.prototype.getSession = function (sessionId) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.get(url + "/sessions/" + sessionId, true); });
    };
    SessionResource.prototype.getDataset = function (sessionId, datasetId) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.get(url + "/sessions/" + sessionId + "/datasets/" + datasetId, true); });
    };
    SessionResource.prototype.getJob = function (sessionId, jobId) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.get(url + "/sessions/" + sessionId + "/jobs/" + jobId, true); });
    };
    SessionResource.prototype.updateSession = function (session) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.put(url + "/sessions/" + session.sessionId, session, true); });
    };
    SessionResource.prototype.updateDataset = function (sessionId, dataset) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.put(url + "/sessions/" + sessionId + "/datasets/" + dataset.datasetId, dataset, true); });
    };
    SessionResource.prototype.updateJob = function (sessionId, job) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.put(url + "/sessions/" + sessionId + "/jobs/" + job.jobId, job, true); });
    };
    SessionResource.prototype.deleteSession = function (sessionId) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.delete(url + "/sessions/" + sessionId, true); });
    };
    SessionResource.prototype.deleteDataset = function (sessionId, datasetId) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.delete(url + "/sessions/" + sessionId + "/datasets/" + datasetId, true); });
    };
    SessionResource.prototype.deleteJob = function (sessionId, jobId) {
        var _this = this;
        var apiUrl$ = this.configService.getSessionDbUrl();
        return apiUrl$.flatMap(function (url) { return _this.restService.delete(url + "/sessions/" + sessionId + "/jobs/" + jobId, true); });
    };
    SessionResource.prototype.copySession = function (sessionData, name) {
        var _this = this;
        var newSession = _.clone(sessionData.session);
        newSession.sessionId = null;
        newSession.name = name;
        var createdSessionId;
        var datasetIdMap = new Map();
        var jobIdMap = new Map();
        // create session
        var createSession$ = this.createSession(newSession);
        var createDatasetsAndDatasets$ = createSession$.flatMap(function (sessionId) {
            createdSessionId = sessionId;
            var createRequests = [];
            // create datasets
            sessionData.datasetsMap.forEach(function (dataset) {
                var datasetCopy = _.clone(dataset);
                datasetCopy.datasetId = null;
                var request = _this.createDataset(createdSessionId, datasetCopy);
                createRequests.push(request);
                request.subscribe(function (newId) {
                    datasetIdMap.set(dataset.datasetId, newId);
                });
            });
            // create jobs
            sessionData.jobsMap.forEach(function (oldJob) {
                var jobCopy = _.clone(oldJob);
                jobCopy.jobId = null;
                var request = _this.createJob(createdSessionId, jobCopy);
                createRequests.push(request);
                request.subscribe(function (newId) {
                    jobIdMap.set(oldJob.jobId, newId);
                });
            });
            return Observable.forkJoin.apply(Observable, createRequests);
        });
        return createDatasetsAndDatasets$.flatMap(function () {
            var updateRequests = [];
            // // update datasets' sourceJob id
            sessionData.datasetsMap.forEach(function (oldDataset) {
                var sourceJobId = oldDataset.sourceJob;
                if (sourceJobId) {
                    var datasetCopy = _.clone(oldDataset);
                    datasetCopy.datasetId = datasetIdMap.get(oldDataset.datasetId);
                    datasetCopy.sourceJob = jobIdMap.get(sourceJobId);
                    updateRequests.push(_this.updateDataset(createdSessionId, datasetCopy));
                }
            });
            // update jobs' inputs' datasetIds
            sessionData.jobsMap.forEach(function (oldJob) {
                var jobCopy = _.clone(oldJob);
                jobCopy.jobId = jobIdMap.get(oldJob.jobId);
                jobCopy.inputs.forEach(function (input) {
                    input.datasetId = datasetIdMap.get(input.datasetId);
                    updateRequests.push(_this.updateJob(createdSessionId, jobCopy));
                });
            });
            return Observable.forkJoin.apply(Observable, updateRequests);
        });
    };
    SessionResource = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [ConfigService, ToolResource, RestService])
    ], SessionResource);
    return SessionResource;
}());
export default SessionResource;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/resources/session.resource.js.map