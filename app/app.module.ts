


angular.module('chipster-web', [ 'chipster-resource', 'chipster-authentication', 'ngRoute', 'ngAnimate', 'flow',
		'restangular', 'LocalStorageModule', 'ngWebSocket', 'angularResizable', 'ui.bootstrap',
	'pdf', 'ngHandsontable' ]);

angular.module('chipster-web').config([
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
