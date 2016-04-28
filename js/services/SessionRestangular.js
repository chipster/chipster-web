chipsterWeb.factory('SessionRestangular', function (
	Restangular, AuthenticationService, ConfigService, ToolRestangular, $q, Utils) {

	var service = Restangular.withConfig(function (RestangularConfigurer) {

		RestangularConfigurer.setBaseUrl(ConfigService.getSessionDbUrl());
		// this service is initialized only once, but the Authentication service will update the returned
		// instance when necessary (login & logout) so that the request is always made with the most up-to-date
		// credentials
		RestangularConfigurer.setDefaultHeaders(AuthenticationService.getTokenHeader());
		RestangularConfigurer.setFullResponse(true);
	});

	// Restangular adds an empty object to the body of the DELETE request, which fails somewhere
	// on the way, not sure where.
	//
	// https://github.com/mgonto/restangular/issues/78
	service.addRequestInterceptor( function(elem, operation) {
		if (operation === 'remove') {
			return undefined;
		}
		return elem;
	});

	service.loadSession = function (sessionId) {

		var sessionUrl = service.one('sessions',  sessionId);
		// get session detail
		var promises = [
			sessionUrl.get(),
			sessionUrl.all('datasets').getList(),
			sessionUrl.all('jobs').getList(),
			ToolRestangular.all('modules').getList(),
			ToolRestangular.all('tools').getList()
		];

		return promise = new Promise(function(resolve) {

			$q.all(promises).then(function (res) {

				//var session = res[0].data;
				var datasets = res[1].data;
				var jobs = res[2].data;
				var modules = res[3].data;
				var tools = res[4].data;


				// store session properties
				var session = {};
				session.sessionName = session.name;
				session.sessionDetail = session.notes;

				session.datasetsMap = Utils.arrayToMap(datasets, 'datasetId');
				session.jobsMap = Utils.arrayToMap(jobs, 'jobId');

				// show only configured modules
				modules = modules.filter(function (module) {
					return ConfigService.getModules().indexOf(module.name) >= 0;
				});

				session.modules = modules;
				session.tools = tools;

				// build maps for modules and categories

				// generate moduleIds
				modules.map(function (m) {
					m.moduleId = m.name.toLowerCase();
					return m;
				});

				session.modulesMap = Utils.arrayToMap(modules, 'moduleId');

				session.modulesMap.forEach(function (module) {
					module.categoriesMap = Utils.arrayToMap(module.categories, 'name');
				});

				resolve(session);
			});
		});
	};

	return service;
});


