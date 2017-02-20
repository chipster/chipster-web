var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import ConfigService from "../../../shared/services/config.service";
import SessionResource from "../../../shared/resources/session.resource";
import { Injectable } from "@angular/core";
import { TokenService } from "../../../core/authentication/token.service";
import { Observable, Subject } from "rxjs";
import SessionEvent from "../../../model/events/sessionevent";
var SessionEventService = (function () {
    function SessionEventService(configService, tokenService, sessionResource) {
        this.configService = configService;
        this.tokenService = tokenService;
        this.sessionResource = sessionResource;
    }
    SessionEventService.prototype.unsubscribe = function () {
        this.wsSubject$.unsubscribe();
    };
    SessionEventService.prototype.setSessionData = function (sessionId, sessionData) {
        var _this = this;
        this.sessionData = sessionData;
        this.sessionId = sessionId;
        var wsStream = this.getWsStream();
        this.localSubject$ = new Subject();
        var stream = wsStream.merge(this.localSubject$)
            .map(function (wsData) {
            console.log('websocket event', wsData);
            return wsData;
        }).catch(function (err, source) {
            console.log('websocket error', err, source);
            return Observable.throw(err);
        }).finally(function () {
            console.info('websocket closed');
        }).publish().refCount();
        this.datasetStream$ = stream
            .filter(function (wsData) { return wsData.resourceType === 'DATASET'; })
            .flatMap(function (data) { return _this.handleDatasetEvent(data, _this.sessionId, _this.sessionData); })
            .publish().refCount();
        this.jobStream$ = stream
            .filter(function (wsData) { return wsData.resourceType === 'JOB'; })
            .flatMap(function (data) { return _this.handleJobEvent(data, _this.sessionId, _this.sessionData); })
            .publish().refCount();
        this.sessionStream$ = stream
            .filter(function (wsData) { return wsData.resourceType === 'SESSION'; })
            .flatMap(function (data) { return _this.handleSessionEvent(data, _this.sessionId, _this.sessionData); })
            .publish().refCount();
        this.authorizationStream$ = stream
            .filter(function (wsData) { return wsData.resourceType === 'AUTHORIZATION'; })
            .flatMap(function (data) { return _this.handleAuthorizationEvent(data, _this.sessionData); })
            .publish().refCount();
        // update sessionData even if no one else subscribes
        this.datasetStream$.subscribe();
        this.jobStream$.subscribe();
        this.sessionStream$.subscribe();
        this.authorizationStream$.subscribe();
    };
    SessionEventService.prototype.getWsStream = function () {
        var _this = this;
        // get the url of the websocket server
        return this.configService.getSessionDbEventsUrl(this.sessionId).flatMap(function (eventsUrl) {
            var wsUrl = eventsUrl + "/events/" + _this.sessionId + "?token=" + _this.tokenService.getToken();
            console.debug('event URL', wsUrl);
            // convert websocket to observable
            _this.wsSubject$ = Observable.webSocket(wsUrl);
            return _this.wsSubject$;
        });
    };
    /**
     * Update sessionData and create a stream of old and new values. The old values
     * are useful for detecting changes.
     *
     * @returns {Observable<SessionEvent>}
     */
    SessionEventService.prototype.getDatasetStream = function () {
        return this.datasetStream$;
    };
    SessionEventService.prototype.getJobStream = function () {
        return this.jobStream$;
    };
    SessionEventService.prototype.getSessionStream = function () {
        return this.sessionStream$;
    };
    SessionEventService.prototype.getAuthorizationStream = function () {
        return this.authorizationStream$;
    };
    SessionEventService.prototype.createEvent = function (event, oldValue, newValue) {
        return Observable.of(new SessionEvent(event, oldValue, newValue));
    };
    SessionEventService.prototype.handleAuthorizationEvent = function (event, sessionData) {
        if (event.type === 'DELETE') {
            return this.createEvent(event, sessionData.session, null);
        }
        else {
            console.warn("unknown event type", event);
        }
    };
    SessionEventService.prototype.handleSessionEvent = function (event, sessionId, sessionData) {
        var _this = this;
        if (event.type === 'UPDATE') {
            return this.sessionResource.getSession(sessionId).flatMap(function (remote) {
                var local = sessionData.session;
                sessionData.session = remote;
                return _this.createEvent(event, local, remote);
            });
        }
        else {
            console.warn("unknown event type", event);
        }
    };
    SessionEventService.prototype.handleDatasetEvent = function (event, sessionId, sessionData) {
        var _this = this;
        if (event.type === 'CREATE') {
            return this.sessionResource.getDataset(sessionId, event.resourceId).flatMap(function (remote) {
                sessionData.datasetsMap.set(event.resourceId, remote);
                return _this.createEvent(event, null, remote);
            });
        }
        else if (event.type === 'UPDATE') {
            return this.sessionResource.getDataset(sessionId, event.resourceId)
                .flatMap(function (remote) {
                var local = sessionData.datasetsMap.get(event.resourceId);
                sessionData.datasetsMap.set(event.resourceId, remote);
                return _this.createEvent(event, local, remote);
            });
        }
        else if (event.type === 'DELETE') {
            var localCopy = sessionData.datasetsMap.get(event.resourceId);
            sessionData.datasetsMap.delete(event.resourceId);
            return this.createEvent(event, localCopy, null);
        }
        else {
            console.warn("unknown event type", event);
        }
    };
    SessionEventService.prototype.handleJobEvent = function (event, sessionId, sessionData) {
        var _this = this;
        if (event.type === 'CREATE') {
            return this.sessionResource.getJob(sessionId, event.resourceId).flatMap(function (remote) {
                sessionData.jobsMap.set(event.resourceId, remote);
                return _this.createEvent(event, null, remote);
            });
        }
        else if (event.type === 'UPDATE') {
            return this.sessionResource.getJob(sessionId, event.resourceId).flatMap(function (remote) {
                var local = sessionData.jobsMap.get(event.resourceId);
                sessionData.jobsMap.set(event.resourceId, remote);
                return _this.createEvent(event, local, remote);
            });
        }
        else if (event.type === 'DELETE') {
            var localCopy = sessionData.jobsMap.get(event.resourceId);
            sessionData.jobsMap.delete(event.resourceId);
            return this.createEvent(event, localCopy, null);
        }
        else {
            console.warn("unknown event type", event.type, event);
        }
    };
    /**
     * Handle a locally generated event just like the real events coming from the websocket.
     *
     * Through this the client can be tricked to show different state from the server. Obviously
     * should be used only for quick hacks.
     *
     * @param event
     */
    SessionEventService.prototype.generateLocalEvent = function (event) {
        // incorrect typing? it really is an object, but the compiler wants a string
        this.localSubject$.next(event);
    };
    SessionEventService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [ConfigService, TokenService, SessionResource])
    ], SessionEventService);
    return SessionEventService;
}());
export default SessionEventService;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/sessionevent.service.js.map