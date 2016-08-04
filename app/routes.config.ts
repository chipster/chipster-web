export default function ($routeProvider) {

    $routeProvider
        .when('/', {templateUrl: 'app/views/home/home.html'})
        .when('/home', {templateUrl: 'app/views/home/home.html'})
        .when('/login', {templateUrl: 'app/views/login/login.html', controller: 'LoginController as vm'})
        .when('/sessions', {
            template: '<session-list></session-list>',
            authenticated: true
        })
        .when('/sessions/:sessionId', {
            templateUrl: 'app/views/sessions/session/session.html',
            controller: 'SessionController as vm',
            authenticated: true
        })
        .otherwise({templateUrl: 'app/views/home/home.html'});
};