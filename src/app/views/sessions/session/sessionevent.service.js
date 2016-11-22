"use strict";
var _ = require("lodash");
var SessionEventService = (function () {
    function SessionEventService(configService, $log, authenticationService, $websocket, sessionResource) {
        this.configService = configService;
        this.$log = $log;
        this.authenticationService = authenticationService;
        this.$websocket = $websocket;
        this.sessionResource = sessionResource;
    }
    SessionEventService.prototype.subscribe = function (sessionId, sessionData, onChange) {
        // creating a websocket object and start listening for the
        // events
        var _this = this;
        return this.configService.getSessionDbEventsUrl(sessionId).then(function (eventUrl) {
            _this.$log.debug('eventUrl', eventUrl);
            _this.ws = _this.$websocket(URI(eventUrl).addSearch('token', _this.authenticationService.getToken()).toString());
            _this.ws.onOpen(function () {
                _this.$log.info('websocket connected');
            });
            _this.ws.onMessage(function (event) {
                _this.handleEvent(JSON.parse(event.data), sessionId, sessionData, onChange);
            });
            _this.ws.onClose(function () {
                _this.$log.info('websocket closed');
            });
            return {
                unsubscribe: function () {
                    _this.ws.close();
                }
            };
        });
    };
    SessionEventService.prototype.handleEvent = function (event, sessionId, sessionData, onChange) {
        this.$log.debug('websocket event', event);
        if (event.resourceType === 'AUTHORIZATION') {
            this.handleAuthorizationEvent(event, sessionData, onChange);
        }
        else if (event.resourceType === 'SESSION') {
            this.handleSessionEvent(event, sessionId, sessionData, onChange);
        }
        else if (event.resourceType === 'DATASET') {
            this.handleDatasetEvent(event, sessionId, sessionData, onChange);
        }
        else if (event.resourceType === 'JOB') {
            this.handleJobEvent(event, sessionId, sessionData, onChange);
        }
        else {
            this.$log.warn("unknwon resource type", event.resourceType, event);
        }
    };
    SessionEventService.prototype.handleAuthorizationEvent = function (event, sessionData, onChange) {
        if (event.type === 'DELETE') {
            onChange(event, sessionData.session, null);
        }
        else {
            this.$log.warn("unknown event type", event);
        }
    };
    SessionEventService.prototype.handleSessionEvent = function (event, sessionId, sessionData, onChange) {
        if (event.type === 'UPDATE') {
            this.sessionResource.getSession(sessionId).then(function (remote) {
                var local = sessionData.session;
                var localCopy = _.cloneDeep(local);
                // update the original instance
                local = _.cloneDeep(remote);
                onChange(event, localCopy, remote);
            });
        }
        else {
            this.$log.warn("unknown event type", event);
        }
    };
    SessionEventService.prototype.handleDatasetEvent = function (event, sessionId, sessionData, onChange) {
        if (event.type === 'CREATE') {
            this.sessionResource.getDataset(sessionId, event.resourceId).then(function (remote) {
                sessionData.datasetsMap.set(event.resourceId, remote);
                onChange(event, null, remote);
            });
        }
        else if (event.type === 'UPDATE') {
            this.sessionResource.getDataset(sessionId, event.resourceId).then(function (remote) {
                var local = sessionData.datasetsMap.get(event.resourceId);
                var localCopy = _.cloneDeep(local);
                // update the original instance
                local = _.cloneDeep(remote);
                onChange(event, localCopy, remote);
            });
        }
        else if (event.type === 'DELETE') {
            var localCopy = _.cloneDeep(sessionData.datasetsMap.get(event.resourceId));
            sessionData.datasetsMap.delete(event.resourceId);
            onChange(event, localCopy, null);
        }
        else {
            this.$log.warn("unknown event type", event);
        }
    };
    SessionEventService.prototype.handleJobEvent = function (event, sessionId, sessionData, onChange) {
        if (event.type === 'CREATE') {
            this.sessionResource.getJob(sessionId, event.resourceId).then(function (remote) {
                sessionData.jobsMap.set(event.resourceId, remote);
                onChange(event, null, remote);
            });
        }
        else if (event.type === 'UPDATE') {
            this.sessionResource.getJob(sessionId, event.resourceId).then(function (remote) {
                var local = sessionData.jobsMap.get(event.resourceId);
                var localCopy = _.cloneDeep(local);
                // update the original instance
                local = _.cloneDeep(remote);
                onChange(event, localCopy, remote);
            });
        }
        else if (event.type === 'DELETE') {
            var localCopy = _.cloneDeep(sessionData.jobsMap.get(event.resourceId));
            sessionData.jobsMap.delete(event.resourceId);
            onChange(event, localCopy, null);
        }
        else {
            this.$log.warn("unknown event type", event.type, event);
        }
    };
    return SessionEventService;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SessionEventService;
SessionEventService.$inject = ['ConfigService', '$log', 'AuthenticationService', '$websocket', 'SessionResource'];
//# sourceMappingURL=sessionevent.service.js.map