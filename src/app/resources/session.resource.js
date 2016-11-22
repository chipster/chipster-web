"use strict";
var utils_service_1 = require("../services/utils.service");
var _ = require("lodash");
var SessionData = (function () {
    function SessionData() {
    }
    return SessionData;
}());
exports.SessionData = SessionData;
var SessionResource = (function () {
    function SessionResource(restangular, authenticationService, configService, toolResource, $q, Utils) {
        this.restangular = restangular;
        this.authenticationService = authenticationService;
        this.configService = configService;
        this.toolResource = toolResource;
        this.$q = $q;
        this.Utils = Utils;
    }
    SessionResource.prototype.getService = function () {
        var _this = this;
        if (!this.service) {
            this.service = this.configService.getSessionDbUrl().then(function (url) {
                var service = _this.restangular.withConfig(function (configurer) {
                    configurer.setBaseUrl(url);
                    // this service is initialized only once, but the Authentication service will update the returned
                    // instance when necessary (login & logout) so that the request is always made with the most up-to-date
                    // credentials
                    configurer.setDefaultHeaders(_this.authenticationService.getTokenHeader());
                    configurer.setFullResponse(true);
                });
                // Restangular adds an empty object to the body of the DELETE request, which fails somewhere
                // on the way, not sure where.
                // https://github.com/mgonto/restangular/issues/78
                service.addRequestInterceptor(function (elem, operation) {
                    if (operation === 'remove') {
                        return undefined;
                    }
                    return elem;
                });
                return service;
            });
        }
        return this.service;
    };
    SessionResource.prototype.parseSessionData = function (param) {
        var _this = this;
        var session = param[0].data;
        var datasets = param[1].data;
        var jobs = param[2].data;
        var modules = param[3].data;
        var tools = param[4].data;
        // is there any less ugly syntax for defining the types of anonymous object?
        var data = new SessionData();
        data.session = session;
        data.datasetsMap = utils_service_1.default.arrayToMap(datasets, 'datasetId');
        data.jobsMap = utils_service_1.default.arrayToMap(jobs, 'jobId');
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
        data.modulesMap = utils_service_1.default.arrayToMap(modules, 'moduleId');
        data.modulesMap.forEach(function (module) {
            module.categoriesMap = utils_service_1.default.arrayToMap(module.categories, 'name');
        });
        return data;
    };
    ;
    SessionResource.prototype.loadSession = function (sessionId) {
        var _this = this;
        return this.getService().then(function (service) {
            var sessionUrl = service.one('sessions', sessionId);
            // get session detail
            var promises = [
                sessionUrl.get(),
                sessionUrl.all('datasets').getList(),
                sessionUrl.all('jobs').getList(),
                _this.toolResource.getModules(),
                _this.toolResource.getTools()
            ];
            return _this.$q.all(promises);
        }).then(function (data) {
            return _this.parseSessionData(data);
        });
    };
    SessionResource.prototype.getSessions = function () {
        return this.getService()
            .then(function (service) { return service.all('sessions').getList(); })
            .then(function (response) { return response.data; });
    };
    SessionResource.prototype.createSession = function (session) {
        return this.getService()
            .then(function (service) { return service.one('sessions').customPOST(session); })
            .then(function (res) {
            var sessionLocation = res.headers('Location');
            // sessionId
            return sessionLocation.substr(sessionLocation.lastIndexOf('/') + 1);
        });
    };
    SessionResource.prototype.createDataset = function (sessionId, dataset) {
        return this.getService()
            .then(function (service) { return service.one('sessions', sessionId).one('datasets').customPOST(dataset); })
            .then(function (res) {
            var location = res.headers('Location');
            return location.substr(location.lastIndexOf('/') + 1);
        });
    };
    SessionResource.prototype.createJob = function (sessionId, job) {
        return this.getService()
            .then(function (service) { return service.one('sessions', sessionId).one('jobs').customPOST(job); })
            .then(function (res) {
            var location = res.headers('Location');
            return location.substr(location.lastIndexOf('/') + 1);
        });
    };
    SessionResource.prototype.getSession = function (sessionId) {
        return this.getService()
            .then(function (service) { return service.one('sessions', sessionId).get(); })
            .then(function (resp) { return resp.data; });
    };
    SessionResource.prototype.getDataset = function (sessionId, datasetId) {
        return this.getService()
            .then(function (service) { return service.one('sessions', sessionId).one('datasets', datasetId).get(); })
            .then(function (resp) { return resp.data; });
    };
    SessionResource.prototype.getJob = function (sessionId, jobId) {
        return this.getService()
            .then(function (service) { return service.one('sessions', sessionId).one('jobs', jobId).get(); })
            .then(function (resp) { return resp.data; });
    };
    SessionResource.prototype.updateSession = function (session) {
        return this.getService().then(function (service) { return service
            .one('sessions', session.sessionId)
            .customPUT(session); });
    };
    SessionResource.prototype.updateDataset = function (sessionId, dataset) {
        return this.getService().then(function (service) { return service
            .one('sessions', sessionId)
            .one('datasets', dataset.datasetId)
            .customPUT(dataset); });
    };
    SessionResource.prototype.updateJob = function (sessionId, job) {
        return this.getService().then(function (service) { return service
            .one('sessions', sessionId)
            .one('jobs', job.jobId)
            .customPUT(job); });
    };
    SessionResource.prototype.deleteSession = function (sessionId) {
        return this.getService().then(function (service) { return service
            .one('sessions', sessionId)
            .remove(); });
    };
    SessionResource.prototype.deleteDataset = function (sessionId, datasetId) {
        return this.getService().then(function (service) { return service
            .one('sessions', sessionId)
            .one('datasets', datasetId)
            .remove(); });
    };
    SessionResource.prototype.deleteJob = function (sessionId, jobId) {
        return this.getService().then(function (service) { return service
            .one('sessions', sessionId)
            .one('jobs', jobId)
            .remove(); });
    };
    SessionResource.prototype.copySession = function (sessionData, name) {
        var _this = this;
        var newSession = _.clone(sessionData.session);
        newSession.sessionId = null;
        newSession.name = name;
        // create session
        return this.createSession(newSession).then(function (sessionId) {
            var datasetIdMap = new Map();
            var jobIdMap = new Map();
            // create datasets
            var createRequests = [];
            sessionData.datasetsMap.forEach(function (dataset) {
                var datasetCopy = _.clone(dataset);
                datasetCopy.datasetId = null;
                var request = _this.createDataset(sessionId, datasetCopy);
                createRequests.push(request);
                request.then(function (newId) {
                    datasetIdMap.set(dataset.datasetId, newId);
                });
            });
            // create jobs
            sessionData.jobsMap.forEach(function (oldJob) {
                var jobCopy = _.clone(oldJob);
                jobCopy.jobId = null;
                var request = _this.createJob(sessionId, jobCopy);
                createRequests.push(request);
                request.then(function (newId) {
                    jobIdMap.set(oldJob.jobId, newId);
                });
            });
            return Promise.all(createRequests).then(function () {
                var updateRequests = [];
                // update datasets' sourceJob id
                sessionData.datasetsMap.forEach(function (oldDataset) {
                    var sourceJobId = oldDataset.sourceJob;
                    if (sourceJobId) {
                        var datasetCopy = _.clone(oldDataset);
                        datasetCopy.datasetId = datasetIdMap.get(oldDataset.datasetId);
                        datasetCopy.sourceJob = jobIdMap.get(sourceJobId);
                        updateRequests.push(_this.updateDataset(sessionId, datasetCopy));
                    }
                });
                // update jobs' inputs' datasetIds
                sessionData.jobsMap.forEach(function (oldJob) {
                    var jobCopy = _.clone(oldJob);
                    jobCopy.jobId = jobIdMap.get(oldJob.jobId);
                    jobCopy.inputs.forEach(function (input) {
                        input.datasetId = datasetIdMap.get(input.datasetId);
                        updateRequests.push(_this.updateJob(sessionId, jobCopy));
                    });
                });
                return Promise.all(updateRequests).then(function () {
                    console.log('session copied');
                });
            });
        });
    };
    return SessionResource;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SessionResource;
SessionResource.$inject = ['Restangular', 'AuthenticationService', 'ConfigService', 'ToolResource', '$q', 'Utils'];
//# sourceMappingURL=session.resource.js.map