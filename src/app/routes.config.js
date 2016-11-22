"use strict";
function default_1($routeProvider) {
    $routeProvider
        .when('/', { templateUrl: 'app/views/home/home.html' })
        .when('/home', { templateUrl: 'app/views/home/home.html' })
        .when('/login', { template: '<login></login>' })
        .when('/sessions', {
        template: '<session-list></session-list>',
        authenticated: true
    })
        .when('/sessions/:sessionId', {
        template: '<session></session>',
        authenticated: true,
        resolve: {
            sessionData: function ($route, SessionResource) {
                return SessionResource.loadSession($route.current.params.sessionId);
            }
        }
    })
        .otherwise({ templateUrl: 'app/views/home/home.html' });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=routes.config.js.map