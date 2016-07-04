export default function ($routeProvider) {

    $routeProvider
        .when('/', {templateUrl: 'app/views/home/home.html'})
        .when('/home', {templateUrl: 'app/views/home/home.html'})
        .when('/login', {templateUrl: 'app/views/login/login.html', controller: 'LoginController'})
        .when('/sessions', {
            templateUrl: 'app/views/sessions/sessionlist.html',
            controller: 'SessionListCtrl',
            authenticated: true
        })
        .when('/sessions/:sessionId', {
            templateUrl: 'app/views/sessions/session/session.html',
            controller: 'SessionCtrl',
            authenticated: true
        })
        .otherwise({templateUrl: 'app/views/home/home.html'});
};