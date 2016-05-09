chipsterWeb.factory('ConfigService', ['$location',
    function ($location) {

        var service = {};

        service.init = function() {

            var serviceLocatorUrl = null;

            // read the API address from the file
            // wait until the config is loaded
            // http://hippieitgeek.blogspot.fi/2013/06/load-json-files-synchronously-with.html
            $.ajax({
                url: '/js/json/config.json',
                async: false,
                dataType: 'json',
                success: function (response) {
                    service.config = response;
                    serviceLocatorUrl = response.serviceLocator;
                    console.log('serviceLocator', serviceLocatorUrl);
                }
            });

            $.ajax({
                url: serviceLocatorUrl + '/services',
                async: false,
                dataType: 'json',
                success: function (response) {
                    service.services = {};
                    angular.forEach(response, function(s) {

                        var camelCaseRole = s.role.replace(/-([a-z])/g, function (m, w) {
                            return w.toUpperCase();
                        });
                        service.services[camelCaseRole] = s.publicUri;
                    });
                    baseURL = service.services.sessionDb;
                    console.log('sessionDb', service.services.sessionDb);
                }
            });

            service.baseUrl = baseURL;
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
    }]);