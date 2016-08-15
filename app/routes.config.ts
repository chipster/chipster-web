export default function ($routeProvider) {

    $routeProvider
        .when('/', {templateUrl: 'views/home/home.html'})
        .when('/home', {templateUrl: 'views/home/home.html'})
        .when('/login', {templateUrl: 'views/login/login.html', controller: 'LoginController as vm'})
        .when('/sessions', {
            template: '<session-list></session-list>',
            authenticated: true
        })
        .when('/sessions/:sessionId', {
            templateUrl: 'views/sessions/session/session.html',
            controller: 'SessionController as vm',
            authenticated: true
        })
        .otherwise({templateUrl: 'views/home/home.html'});
};