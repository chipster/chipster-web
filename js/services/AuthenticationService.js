chipsterWeb.factory('AuthenticationService', ['localStorageService', '$http', 'baseURLString',
    function (localStorageService, $http, baseURLString) {

        var service = {};

        // Do the authentication here based on userid and password
        service.login = function (username, password) {

            // clear any old tokens
            service.setAuthToken(null);

            return this.requestToken('POST', username, password).then(function (response) {
                // login successful
                service.setAuthToken(response.data.tokenKey);
            });
        };

        service.logout = function () {
            localStorageService.clearAll();
        };

        service.getTokenHeader = function () {
            service.updateTokenHeader();
            return this.tokenHeader;
        };

        service.requestToken = function (method, username, password) {
            var string = username + ":" + password;
            var encodedString = btoa(string); //Convert it to base64 encoded string

            return promise = $http({
                url: baseURLString + 'auth' + '/' + 'tokens',
                method: method,
                withCredentials: true,
                headers: {'Authorization': 'Basic ' + encodedString}
            });
        };

        service.getToken = function () {
            return localStorageService.get('auth-token');
        };

        service.setAuthToken = function (val) {
            localStorageService.set('auth-token', val);
            service.updateTokenHeader();
        };

        service.updateTokenHeader = function () {
            // return always the same instance so that we can update it later
            if (!service.tokenHeader) {
                service.tokenHeader = {};
            }
            this.tokenHeader['Authorization'] = 'Basic ' + btoa('token' + ':' + service.getToken())
        };

        return service;
    }]);