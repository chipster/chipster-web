angular.module('chipster-web').factory('ConfigService',
    function ($location, ConfigurationResource, ChipsterModules) {

        var service = {
            config: {modules: ["NGS", "Microarray", "Misc"]}
        };

        service.init = function() {
            var baseUrl;
            ConfigurationResource.getConfigurationResource().query().$promise.then( response => {
                service.services = {};
                angular.forEach(response, s => {

                    var camelCaseRole = s.role.replace(/-([a-z])/g, (m, w) => w.toUpperCase() );
                    service.services[camelCaseRole] = s.publicUri;
                });
                service.baseUrl = service.services.sessionDb;
                console.log('sessionDb', service.services.sessionDb);
            });

        };

        service.getApiUrl = function () {
            return service.baseUrl;
        };

        service.getSessionDbUrl = function () {
            if (service.services.sessionDb) {
                return service.services.sessionDb;
            }
            return service.baseUrl + 'sessiondb' + '/';
        };

        service.getSessionDbEventsUrl = function (sessionId) {

            if (service.services.sessionDbEvents) {
                return URI(service.services.sessionDbEvents).path('events/' + sessionId).toString();
            }

            // different api server
            var eventUrl = service.baseUrl
                .replace('http://', 'ws://')
                .replace('https://', 'wss://')
                + 'sessiondbevents/events/' + sessionId;

            // api and client served from the same host
            if (service.baseUrl === "") {
                eventUrl = "ws://" + $location.host() + ":" + $location.port()
                    + "/sessiondbevents/events/" + sessionId;
            }

            return eventUrl;
        };

        service.getAuthUrl = function () {
            if (service.services.authenticationService) {
                return service.services.authenticationService;
            }
            return service.baseUrl + 'auth' + '/';
        };

        service.getFileBrokerUrl = function () {
            if (service.services.fileBroker) {
                return service.services.fileBroker;
            }
            return service.baseUrl + 'filebroker' + '/';
        };

        service.getToolboxUrl = function () {
            if (service.services.toolbox) {
                return service.services.toolbox;
            }
            return service.baseUrl + 'toolbox/';
        };

        service.getModules = function () {
            return service.config.modules;
        };

        return service;
    });