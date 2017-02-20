var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import SessionResource from "../../shared/resources/session.resource";
import Session from "../../model/session/session";
import { Component } from "@angular/core";
import { Router } from "@angular/router";
export var SessionListComponent = (function () {
    function SessionListComponent(router, sessionResource) {
        this.router = router;
        this.sessionResource = sessionResource;
    }
    SessionListComponent.prototype.ngOnInit = function () {
        this.selectedSessions = [];
        this.updateSessions();
    };
    SessionListComponent.prototype.createSession = function () {
        var _this = this;
        var session = new Session('New session');
        this.sessionResource.createSession(session).subscribe(function (sessionId) {
            session.sessionId = sessionId;
            _this.openSession(sessionId);
        });
    };
    SessionListComponent.prototype.updateSessions = function () {
        var _this = this;
        this.sessionResource.getSessions().subscribe(function (sessions) {
            _this.userSessions = sessions;
        }, function (response) {
            console.log('failed to get sessions', response);
            if (response.status === 401 || response.status === 403) {
                _this.router.navigate(['/login']);
            }
        });
    };
    SessionListComponent.prototype.openSession = function (sessionId) {
        this.router.navigate(['/sessions', sessionId]);
    };
    SessionListComponent.prototype.selectSession = function (event, session) {
        var _this = this;
        this.selectedSessions = [session];
        if (this.selectedSessions.length === 1) {
            if (session !== this.previousSession) {
                // hide the old session immediately
                this.previousSession = session;
                this.sessionData = null;
                this.sessionResource.loadSession(this.selectedSessions[0].sessionId).subscribe(function (fullSession) {
                    // don't show if the selection has already changed
                    if (_this.selectedSessions[0] === session) {
                        _this.sessionData = fullSession;
                    }
                });
            }
        }
    };
    SessionListComponent.prototype.deleteSession = function (session) {
        var _this = this;
        this.sessionResource.deleteSession(session.sessionId).subscribe(function (response) {
            _this.updateSessions();
            _this.selectedSessions.length = 0;
        }, function () {
            console.error('Error in deleting session');
        });
    };
    SessionListComponent.prototype.isSessionSelected = function (session) {
        return this.selectedSessions.indexOf(session) !== -1;
    };
    SessionListComponent.prototype.getWorkflowCallback = function () {
        return {
            isSelectedDataset: function () {
            },
            isSelectedJob: function () {
            }
        };
    };
    SessionListComponent = __decorate([
        Component({
            selector: 'ch-session-list',
            templateUrl: './sessionlist.html',
            styleUrls: ['./sessionlist.less']
        }), 
        __metadata('design:paramtypes', [Router, SessionResource])
    ], SessionListComponent);
    return SessionListComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/sessionlist.component.js.map