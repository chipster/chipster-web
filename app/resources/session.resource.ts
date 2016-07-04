
SessionResource.$inject = ['Restangular', 'AuthenticationService', 'ConfigService', 'ToolRestangular', '$q', 'Utils'];

function SessionResource(Restangular, AuthenticationService, ConfigService, ToolRestangular, $q, Utils) {

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

	service.parseSessionData = function (param) {
		var session = param[0].data;
		var datasets = param[1].data;
		var jobs = param[2].data;
		var modules = param[3].data;
		var tools = param[4].data;

		var data = {};

		data.session = session;
		data.datasetsMap = Utils.arrayToMap(datasets, 'datasetId');
		data.jobsMap = Utils.arrayToMap(jobs, 'jobId');

		// show only configured modules
		modules = modules.filter(function (module) {
			return ConfigService.getModules().indexOf(module.name) >= 0;
		});

		data.modules = modules;
		data.tools = tools;

		// build maps for modules and categories

		// generate moduleIds
		modules.map(function (m) {
			m.moduleId = m.name.toLowerCase();
			return m;
		});

		data.modulesMap = Utils.arrayToMap(modules, 'moduleId');

		data.modulesMap.forEach(function (module) {
			module.categoriesMap = Utils.arrayToMap(module.categories, 'name');
		});

		return data;
	};
	
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

		return $q.all(promises);
	};

	return service;
};


export default SessionResource;