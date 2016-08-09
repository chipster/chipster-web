
import AuthenticationService from "../authentication/authenticationservice";
import * as restangular from "restangular";
import ConfigService from "../services/ConfigService";
import ToolResource from "../resources/toolresource";
import Utils from "../services/Utils";
import Session from "../views/sessions/session/model/session";
import Dataset from "../views/sessions/session/model/dataset";
import Module from "../views/sessions/session/model/module";
import Tool from "../views/sessions/session/model/tool";
import Job from "../views/sessions/session/model/job";

export default class SessionResource {

	static $inject = ['Restangular', 'AuthenticationService', 'ConfigService', 'ToolResource', '$q', 'Utils'];

	public service: any;

	constructor(private restangular: restangular.IService,
				private authenticationService:AuthenticationService,
				private configService: ConfigService,
				private toolResource: ToolResource,
				private $q:ng.IQService,
				private Utils: Utils) {

		this.service = this.restangular.withConfig( (configurer: any) => {
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
		this.service.addRequestInterceptor( (elem: any, operation: any) => {
			if (operation === 'remove') { return undefined; }
			return elem;
		});

	}

	parseSessionData(param: any) {
		let session = param[0].data;
		let datasets = param[1].data;
		let jobs = param[2].data;
		let modules = param[3].data;
		let tools = param[4].data;

		// is there any less ugly syntax for defining the types of anonymous object?
		let data = {
			session: Session,
			datasetsMap: <Map<string, Dataset>>null,
			jobsMap: <Map<string, Job>>null,
			modules: <Module[]>null,
			tools: <Tool[]>null,
			modulesMap: <Map<string, Module>>null,
		};

		data.session = session;
		data.datasetsMap = Utils.arrayToMap(datasets, 'datasetId');
		data.jobsMap = Utils.arrayToMap(jobs, 'jobId');

		// show only configured modules
		modules = modules.filter( (module: Module) => this.configService.getModules().indexOf(module.name) >= 0 );

		data.modules = modules;
		data.tools = tools;

		// build maps for modules and categories

		// generate moduleIds
		modules.map( (module:any) => {
			module.moduleId = module.name.toLowerCase();
			return module;
		});

		data.modulesMap = Utils.arrayToMap(modules, 'moduleId');

		data.modulesMap.forEach( (module:any) => {
			module.categoriesMap = Utils.arrayToMap(module.categories, 'name');
		});

		return data;
	};

	loadSession(sessionId: string) {

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