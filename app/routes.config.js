angular.module('chipster-web').config(function($routeProvider) {

        $routeProvider
            .when('/', { templateUrl : 'app/views/home/home.html'})
            .when('/home', { templateUrl : 'app/views/home/home.html'})
            .when('/login', { templateUrl : 'app/views/login/login.html', controller : 'LoginCtrl'})
            .when('/sessions', { templateUrl : 'app/views/sessions/sessionlist.html', controller: 'SessionListCtrl', authenticated : true })
            .when('/session/:sessionId', { templateUrl : 'app/views/sessions/session/session.html', controller: 'SessionCtrl', authenticated : true })

    });