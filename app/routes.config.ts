import IRoute = angular.route.IRoute;

interface IAuthRoute extends IRoute {
    authenticated: boolean;
}

export default function($routeProvider: ng.route.IRouteProvider) {

    $routeProvider
        .when('/', {templateUrl: 'views/home/home.html'})
        .when('/home', {templateUrl: 'views/home/home.html'})
        .when('/login', {template: '<login></login>'})
        .when('/sessions', <IAuthRoute>{
            template: '<session-list></session-list>',
            authenticated: true
        })
        .when('/sessions/:sessionId', <IAuthRoute>{
            template: '<session></session>',
            authenticated: true,
            resolve: {
                sessionData: ($route, SessionResource) => {
                    return SessionResource.loadSession($route.current.params.sessionId);
                }
            }
        })
        .otherwise({templateUrl: 'views/home/home.html'});
};

