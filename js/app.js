var chipsterWeb = angular.module('chipster-web', [ 'ngRoute', 'flow',
		'restangular', 'LocalStorageModule', 'ngWebsocket', 'angularResizable',
		'pdf', 'ngHandsontable' ]);


// read the API address from the file
// wait until the config is loaded
// http://hippieitgeek.blogspot.fi/2013/06/load-json-files-synchronously-with.html
$.ajax({
	url: '/js/json/config.json',
	async: false,
	dataType: 'json',
	success: function (response) {
		var apiHost = response.api[0];
		if (apiHost === "") {
			// empty string if the same proxy is serving both client files and the API
			baseURL = "";
		} else {
			baseURL = 'http://' + apiHost + '/';
		}
	}
});

// defining the base Url as constant
chipsterWeb.constant('baseURLString', baseURL);

// configure our route
chipsterWeb.config([ '$routeProvider', 'RestangularProvider',
		function($routeProvider, RestangularProvider) {
			// Config the base url
			RestangularProvider.setBaseUrl(baseURL);

			$routeProvider
			// route for home page
			.when('/', {
				templateUrl : 'partials/home.html'
			}).when('/home', {
				templateUrl : 'partials/home.html'
			})
			// route for login page
			.when('/login', {
				templateUrl : 'partials/login.html',
				controller : 'LoginCtrl'
			}).when('/session/:sessionId', {
				templateUrl : 'partials/session.html',
				authenticated : true

			}).when('/sessions', {
				templateUrl : 'partials/sessionlist.html',
				authenticated : true

			});

		} ]);

chipsterWeb.config([
		'flowFactoryProvider',
		function(flowFactoryProvider) {
			flowFactoryProvider.defaults = {
				// continuation from different browser session not implemented
				testChunks : false,
				method : 'octet',
				uploadMethod : 'PUT',
				// upload the chunks in order
				simultaneousUploads : 1,
				// don't spend time between requests too often
				chunkSize : 50000000,
				// fail on 409 Conflict
				permanentErrors : [ 404, 409, 415, 500, 501 ],
				// make numbers easier to read (default 500)
				progressCallbacksInterval : 1000,
				// manual's recommendation for big files
				speedSmoothingFactor : 0.02
			};
			/*
			 * flowFactoryProvider.on('catchAll', function(event) {
			 * console.log('catchAll', arguments); });
			 */

			// process errors here, because the error callback in html file
			// doesn't have the chunk parameter
			flowFactoryProvider.on('error', function(msg, file, chunk) {
				file.errorMessage = chunk.xhr.status + ' '
						+ chunk.xhr.statusText + ': ' + msg;
				file.errorMessageDetails = chunk.xhr.responseURL;
			});
		} ]);

chipsterWeb.run(function($rootScope, $location, AuthenticationService) {
	$rootScope.$on("$routeChangeStart", function(event, next) {
		if (next.$$route.authenticated) {
			var userAuth = AuthenticationService.getToken();
			if (!userAuth) {
				console.log('token not found, forward to login');
				$location.path('/login');
			}
		}
	});
});

chipsterWeb.filter('bytes', function() {
	return function(bytes, precision) {
		if (isNaN(parseFloat(bytes)) || !isFinite(bytes))
			return '-';
		if (bytes === 0)
			return '';
		if (typeof precision === 'undefined')
			precision = 1;
		var units = [ 'bytes', 'kB', 'MB', 'GB', 'TB', 'PB' ], number = Math
				.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision)
				+ ' ' + units[number];
	};
});

chipsterWeb.filter('seconds', function() {
	return function(seconds) {
		if (isNaN(parseFloat(seconds)) || !isFinite(seconds))
			return '-';
		if (seconds === 0)
			return '';
		var units = [ 'seconds', 'minutes', 'hours' ], number = Math.floor(Math
				.log(seconds)
				/ Math.log(60));
		return (seconds / Math.pow(60, Math.floor(number))).toFixed(0) + ' '
				+ units[number];
	};
});
