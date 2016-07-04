import AuthenticationService from "../../../authentication/authenticationservice";
import ConfigService from "../../../services/ConfigService";

export default class SessionEventService{
    ws: any;

    static $inject = ['ConfigService', '$log', 'AuthenticationService', '$websocket', 'SessionRestangular'];

    constructor(private configService: ConfigService,
                private $log: ng.ILogService,
                private authenticationService: AuthenticationService,
                private $websocket: any,
                private SessionRestangular: any){
        console.log(this.$log);
    }

    subscribe(sessionId, localData, onChange) {

        // creating a websocket object and start listening for the
        // events

        var eventUrl = this.configService.getSessionDbEventsUrl(sessionId);

        this.$log.debug('eventUrl', eventUrl);
        this.ws = this.$websocket(new URI(eventUrl).addQuery('token', this.authenticationService.getToken()).toString());

        this.ws.onOpen(function () {
            this.$log.info('websocket connected');
        });

        this.ws.onMessage(function (event) {
            this.handleEvent(JSON.parse(event.data), sessionId, localData, onChange);
        });

        this.ws.onClose(function () {
            this.$log.info('websocket closed');
        });

        return {
            unsubscribe: function () {
                this.ws.close();
            }
        }
    };

    handleEvent(event, sessionId, data, onChange) {

        var sessionUrl = this.SessionRestangular.one('sessions', sessionId);

        this.$log.debug('websocket event', event);

        if (event.resourceType === 'AUTHORIZATION') {
            this.handleAuthorizationEvent(event, data, onChange);

        } else if (event.resourceType === 'SESSION') {
            this.handleSessionEvent(event, sessionUrl, data, onChange);

        } else if (event.resourceType === 'DATASET') {
            this.handleDatasetEvent(event, sessionUrl, data, onChange);

        } else if (event.resourceType === 'JOB') {
            this.handleJobEvent(event, sessionUrl, data, onChange);

        } else {
            this.$log.warn("unknwon resource type", event.resourceType, event);
        }
    };

    handleAuthorizationEvent(event, data, onChange) {
        if (event.type === 'DELETE') {
            onChange(event, data.session, null);

        } else {
            this.$log.warn("unknown event type", event);
        }
    };

    handleSessionEvent(event, sessionUrl, data, onChange) {
        if (event.type === 'UPDATE') {
            sessionUrl.get().then(function (resp) {
                var local = data.session;
                var localCopy = angular.copy(local);
                var remote = resp.data;

                // update the original instance
                angular.copy(remote, local);

                onChange(event, localCopy, remote);
            });

        } else {
            this.$log.warn("unknown event type", event);
        }
    };

    handleDatasetEvent(event, sessionUrl, data, onChange) {
        if (event.type === 'CREATE') {
            sessionUrl.one('datasets', event.resourceId).get().then(function (resp) {
                data.datasetsMap.set(event.resourceId, resp.data);
                onChange(event, null, resp.data);
            });

        } else if (event.type === 'UPDATE') {
            sessionUrl.one('datasets', event.resourceId).get().then(function (resp) {

                var local = data.datasetsMap.get(event.resourceId);
                var localCopy = angular.copy(local);
                var remote = resp.data;

                // update the original instance
                angular.copy(remote, local);
                onChange(event, localCopy, remote);
            });

        } else if (event.type === 'DELETE') {
            var localCopy = angular.copy(data.datasetsMap.get(event.resourceId));
            data.datasetsMap.delete(event.resourceId);
            onChange(event, localCopy, null);

        } else {
            this.$log.warn("unknown event type", event);
        }
    };

    handleJobEvent(event, sessionUrl, data, onChange) {
        if (event.type === 'CREATE') {
            sessionUrl.one('jobs', event.resourceId).get().then(function (resp) {
                data.jobsMap.set(event.resourceId, resp.data);
                onChange(event, null, resp.data);
            });

        } else if (event.type === 'UPDATE') {
            sessionUrl.one('jobs', event.resourceId).get().then(function (resp) {
                var local = data.jobsMap.get(event.resourceId);
                var localCopy = angular.copy(local);
                var remote = resp.data;

                // update the original instance
                angular.copy(remote, local);
                onChange(event, localCopy, remote);
            });

        } else if (event.type === 'DELETE') {
            var localCopy = angular.copy(data.jobsMap.get(event.resourceId));
            data.jobsMap.delete(event.resourceId);
            onChange(event, localCopy, null);

        } else {
            this.$log.warn("unknown event type", event.type, event);
        }
    };


}
