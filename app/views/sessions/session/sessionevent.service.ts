export default function (ConfigService, $log, AuthenticationService, $websocket, SessionRestangular) {
    var service = {};
    service.ws = null;

    service.subscribe = function (sessionId, localData, onChange) {

        // creating a websocket object and start listening for the
        // events

        var eventUrl = ConfigService.getSessionDbEventsUrl(sessionId);

        $log.debug('eventUrl', eventUrl);
        service.ws = $websocket(new URI(eventUrl).addQuery('token', AuthenticationService.getToken()).toString());

        service.ws.onOpen(function () {
            $log.info('websocket connected');
        });

        service.ws.onMessage(function (event) {
            service.handleEvent(JSON.parse(event.data), sessionId, localData, onChange);
        });

        service.ws.onClose(function () {
            $log.info('websocket closed');
        });

        return {
            unsubscribe: function () {
                service.ws.close();
            }
        }
    };

    service.handleEvent = function(event, sessionId, data, onChange) {

        var sessionUrl = SessionRestangular.one('sessions', sessionId);

        $log.debug('websocket event', event);

        if (event.resourceType === 'AUTHORIZATION') {
            service.handleAuthorizationEvent(event, data, onChange);

        } else if (event.resourceType === 'SESSION') {
            service.handleSessionEvent(event, sessionUrl, data, onChange);

        } else if (event.resourceType === 'DATASET') {
            service.handleDatasetEvent(event, sessionUrl, data, onChange);

        } else if (event.resourceType === 'JOB') {
            service.handleJobEvent(event, sessionUrl, data, onChange);

        } else {
            $log.warn("unknwon resource type", event.resourceType, event);
        }
    };

    service.handleAuthorizationEvent = function (event, data, onChange) {
        if (event.type === 'DELETE') {
            onChange(event, data.session, null);

        } else {
            $log.warn("unknown event type", event);
        }
    };

    service.handleSessionEvent = function (event, sessionUrl, data, onChange) {
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
            $log.warn("unknown event type", event);
        }
    };

    service.handleDatasetEvent = function (event, sessionUrl, data, onChange) {
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
            $log.warn("unknown event type", event);
        }
    };

    service.handleJobEvent = function (event, sessionUrl, data, onChange) {
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
            $log.warn("unknown event type", event.type, event);
        }
    };

    return service;
};
