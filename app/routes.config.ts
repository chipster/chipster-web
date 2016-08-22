import IRoute = angular.route.IRoute;

interface IAuthRoute extends IRoute {
    authenticated: boolean;
}

export default function ($routeProvider: ng.route.IRouteProvider) {

    $routeProvider
        .when('/', {templateUrl: 'views/home/home.html'})
        .when('/home', {templateUrl: 'views/home/home.html'})
        .when('/login', {template: '<login></login>'})
        .when('/sessions', <IAuthRoute>{
            template: '<session-list></session-list>',
            authenticated: true
        })
        .when('/sessions/:sessionId', <IAuthRoute>{
            templateUrl: 'views/sessions/session/session.html',
            controller: 'SessionController as vm',
            authenticated: true
        })
        .otherwise({templateUrl: 'views/home/home.html'});
};