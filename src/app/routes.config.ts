import IRoute = angular.route.IRoute;
import SessionResource from "./shared/resources/session.resource";

interface IAuthRoute extends IRoute {
    authenticated: boolean;
}

export default function($routeProvider: ng.route.IRouteProvider) {

    $routeProvider
        .when('/', { template: '<ch-home></ch-home>' })
        .when('/home', { template: '<ch-home></ch-home>' })
        .when('/login', { template: '<ch-login></ch-login>' })
        .when('/sessions', <IAuthRoute>{
            template: '<session-list></session-list>',
            authenticated: true
        })
        .when('/sessions/:sessionId', <IAuthRoute>{
            template: '<session></session>',
            authenticated: true,
            resolve: {
                sessionData: ($route: ng.route.IRouteService, SessionResource: SessionResource) => {
                    return SessionResource.loadSession($route.current.params.sessionId).toPromise();
                }
            }
        })
        .otherwise({ template: '<ch-home></ch-home>' });
};

