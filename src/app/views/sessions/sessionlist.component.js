"use strict";
var session_1 = require("../../model/session/session");
var SessionListController = (function () {
    function SessionListController($location, sessionResource, $uibModal, sessionWorkerResource, $scope) {
        this.$location = $location;
        this.sessionResource = sessionResource;
        this.$uibModal = $uibModal;
        this.sessionWorkerResource = sessionWorkerResource;
        this.$scope = $scope;
        this.isOpening = false;
        this.updateSessions();
    }
    SessionListController.prototype.createSession = function () {
        var _this = this;
        var session = new session_1.default('New session');
        this.sessionResource.createSession(session).then(function (sessionId) {
            session.sessionId = sessionId;
            _this.openSession(session);
        });
    };
    SessionListController.prototype.updateSessions = function () {
        var _this = this;
        this.sessionResource.getSessions().then(function (sessions) {
            _this.userSessions = sessions;
        }, function (response) {
            console.log('failed to get sessions', response);
            if (response.status === 403) {
                _this.$location.path('/login');
            }
        });
    };
    SessionListController.prototype.openSession = function (session) {
        this.$location.path("/sessions" + "/" + session.sessionId);
    };
    SessionListController.prototype.openSessionFile = function (event) {
        // why is the file dialog triggered twice every now and then without this?
        event.stopImmediatePropagation();
        /*
        File dialog is opened by triggering a fake click event on the hidden file input.
        Browsers allow the file input to open only if this is called directly from some
        user generated event (like clicking a button).
         */
        var input = document.getElementById('open-session-file-input');
        angular.element(input).trigger('click'); // open dialog
    };
    SessionListController.prototype.uploadSessionFile = function (event, files) {
        var _this = this;
        this.isOpening = true;
        var session = new session_1.default('New session');
        return this.sessionResource.createSession(session).then(function (sessionId) {
            session.sessionId = sessionId;
            _this.$uibModal.open({
                animation: true,
                templateUrl: 'session/leftpanel/adddatasetmodal/adddatasetmodal.html',
                controller: 'AddDatasetModalController',
                controllerAs: 'vm',
                bindToController: true,
                size: 'lg',
                resolve: {
                    datasetsMap: function () {
                        return new Map();
                    },
                    sessionId: function () {
                        return sessionId;
                    },
                    oneFile: function () { return true; },
                    files: function () { return files; }
                }
            }).result.then(function (datasets) {
                console.log('session file uploaded');
                console.log('extract session');
                return _this.sessionWorkerResource.extractSession(sessionId, datasets[0]).then(function (warnings) {
                    console.log('extracted, warnings: ', warnings);
                    return _this.sessionResource.deleteDataset(sessionId, datasets[0]);
                }).then(function (res) {
                    console.log('uploaded session file deleted', res);
                    console.log('change view');
                    _this.isOpening = false;
                    _this.$scope.$apply(function () {
                        _this.openSession(session);
                    });
                });
            });
        });
    };
    SessionListController.prototype.selectSession = function (event, session) {
        var _this = this;
        this.selectedSessions = [session];
        if (this.selectedSessions.length === 1) {
            if (session !== this.previousSession) {
                // hide the old session immediately
                this.previousSession = session;
                this.sessionData = null;
                this.sessionResource.loadSession(this.selectedSessions[0].sessionId).then(function (fullSession) {
                    // don't show if the selection has already changed
                    if (_this.selectedSessions[0] === session) {
                        _this.sessionData = fullSession;
                    }
                });
            }
        }
    };
    SessionListController.prototype.deleteSessions = function (sessions) {
        var _this = this;
        // preview could cause errors
        this.selectedSessions.length = 0;
        sessions.forEach(function (session) {
            _this.sessionResource.deleteSession(session.sessionId).then(function (res) {
                console.log("session deleted", res);
                _this.updateSessions();
                _this.selectedSessions = [];
            });
        });
    };
    SessionListController.prototype.isSessionSelected = function (session) {
        return this.selectedSessions.indexOf(session) !== -1;
    };
    SessionListController.prototype.getWorkflowCallback = function () {
        return {
            isSelectedDataset: function () {
            },
            isSelectedJob: function () {
            }
        };
    };
    return SessionListController;
}());
SessionListController.$inject = ['$location', 'SessionWorkerResource', '$uibModal', 'SessionWorkerResource', '$scope'];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    controller: SessionListController,
    templateUrl: 'app/views/sessions/sessionlist.html'
};
//# sourceMappingURL=sessionlist.component.js.map
