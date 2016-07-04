
import AuthenticationService from "../authentication/authenticationservice";
import * as restangular from "restangular";
import ConfigService from "../services/ConfigService";
import ToolResource from "../resources/toolresource";

export default class SessionResource {

	static $inject = ['Restangular', 'AuthenticationService', 'ConfigService', 'ToolResource', '$q', 'Utils'];

	public service: any;

	constructor(private restangular: restangular.IService,
				private authenticationService:AuthenticationService,
				private configService: ConfigService,
				private toolResource: ToolResource,
				private $q:ng.IQService,
				private Utils: any) {

		this.service = this.restangular.withConfig( (configurer) => {
			configurer.setBaseUrl(this.configService.getSessionDbUrl());
			// this service is initialized only once, but the Authentication service will update the returned
			// instance when necessary (login & logout) so that the request is always made with the most up-to-date
			// credentials
			configurer.setDefaultHeaders(this.authenticationService.getTokenHeader());
			configurer.setFullResponse(true);
		});

		// Restangular adds an empty object to the body of the DELETE request, which fails somewhere
		// on the way, not sure where.
		// https://github.com/mgonto/restangular/issues/78
		this.service.addRequestInterceptor( (elem, operation) => {
			if (operation === 'remove') { return undefined; }
			return elem;
		});

	}

	parseSessionData(param) {
		var session = param[0].data;
		var datasets = param[1].data;
		var jobs = param[2].data;
		var modules = param[3].data;
		var tools = param[4].data;

		let data = {};

		data.session = session;
		data.datasetsMap = this.Utils.arrayToMap(datasets, 'datasetId');
		data.jobsMap = this.Utils.arrayToMap(jobs, 'jobId');

		// show only configured modules
		modules = modules.filter( (module) => this.configService.getModules().indexOf(module.name) >= 0 );

		data.modules = modules;
		data.tools = tools;

		// build maps for modules and categories

		// generate moduleIds
		modules.map( (module:any) => {
			module.moduleId = module.name.toLowerCase();
			return module;
		});

		data.modulesMap = this.Utils.arrayToMap(modules, 'moduleId');

		data.modulesMap.forEach( (module:any) => {
			module.categoriesMap = this.Utils.arrayToMap(module.categories, 'name');
		});

		return data;
	};

	loadSession(sessionId) {

		var sessionUrl = this.service.one('sessions', sessionId);
		// get session detail
		var promises = [
			sessionUrl.get(),
			sessionUrl.all('datasets').getList(),
			sessionUrl.all('jobs').getList(),
			this.toolResource.service.all('modules').getList(),
			this.toolResource.service.all('tools').getList()
		];

		return this.$q.all(promises);
	};

}