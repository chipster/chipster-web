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
                    serviceLocatorUrl = response.serviceLocator;
                    console.log('serviceLocator', serviceLocatorUrl);
                }
            });

            $.ajax({
                url: serviceLocatorUrl + '/services',
                async: false,
                dataType: 'json',
                success: function (response) {
                    service.config = {};
                    angular.forEach(response, function(s) {

                        var camelCaseRole = s.role.replace(/-([a-z])/g, function (m, w) {
                            return w.toUpperCase();
                        });
                        service.config[camelCaseRole] = s.publicUri;
                    });
                    baseURL = service.config.sessionDb;
                    console.log('sessionDb', service.config.sessionDb);
                }
            });

            service.baseUrl = baseURL;
        }

        service.getApiUrl = function () {
            return service.baseUrl;
        };

        service.getSessionDbUrl = function () {
            if (service.config.sessionDb) {
                return service.config.sessionDb;
            }
            return service.baseUrl + 'sessiondb' + '/';
        };

        service.getSessionDbEventsUrl = function (sessionId) {

            if (service.config.sessionDbEvents) {
                return service.config.sessionDbEvents
                + 'events/' + sessionId;
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
            if (service.config.authenticationService) {
                return service.config.authenticationService;
            }
            return service.baseUrl + 'auth' + '/';
        };

        service.getFileBrokerUrl = function () {
            if (service.config.fileBroker) {
                return service.config.fileBroker;
            }
            return service.baseUrl + 'filebroker' + '/';
        };

        service.getToolboxUrl = function () {
            if (service.config.toolbox) {
                return service.config.toolbox;
            }
            return service.baseUrl + 'toolbox/';
        };

        return service;
    }]);