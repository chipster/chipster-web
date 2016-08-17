
import AuthenticationService from "../authentication/authenticationservice";
import * as restangular from "restangular";
import ConfigService from "../services/config.service";
import ToolResource from "../resources/toolresource";
import Utils from "../services/utils.service";
import Session from "../model/session/session";
import Dataset from "../model/session/dataset";
import Module from "../model/session/module";
import Tool from "../model/session/tool";
import Job from "../model/session/job";
import IService = restangular.IService;

export class SessionData {
	session: Session;
	datasetsMap: Map<string, Dataset>;
	jobsMap: Map<string, Job>;
	modules: Module[];
	tools: Tool[];
	modulesMap: Map<string, Module>;
}

export default class SessionResource {

	static $inject = ['Restangular', 'AuthenticationService', 'ConfigService', 'ToolResource', '$q', 'Utils'];

	public service: any;

	constructor(private restangular: restangular.IService,
				private authenticationService:AuthenticationService,
				private configService: ConfigService,
				private toolResource: ToolResource,
				private $q:ng.IQService,
				private Utils: Utils) {
	}

	getService() {

		if (!this.service) {
			this.service = this.configService.getSessionDbUrl().then((url: string) => {

				let service: any = this.restangular.withConfig((configurer: any) => {
					configurer.setBaseUrl(url);
					// this service is initialized only once, but the Authentication service will update the returned
					// instance when necessary (login & logout) so that the request is always made with the most up-to-date
					// credentials
					configurer.setDefaultHeaders(this.authenticationService.getTokenHeader());
					configurer.setFullResponse(true);
				});

				// Restangular adds an empty object to the body of the DELETE request, which fails somewhere
				// on the way, not sure where.
				// https://github.com/mgonto/restangular/issues/78
				service.addRequestInterceptor((elem: any, operation: any) => {
					if (operation === 'remove') {
						return undefined;
					}
					return elem;
				});

				return service;
			});
		}
		return this.service;
	}

	parseSessionData(param: any) {
		let session: Session = param[0].data;
		let datasets: Dataset[] = param[1].data;
		let jobs: Job[] = param[2].data;
		let modules: Module[] = param[3].data;
		let tools: Tool[] = param[4].data;

		// is there any less ugly syntax for defining the types of anonymous object?
		let data = new SessionData();

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

		return this.getService().then((service: IService) => {
			var sessionUrl = service.one('sessions', sessionId);

			// get session detail
			var promises = [
				sessionUrl.get(),
				sessionUrl.all('datasets').getList(),
				sessionUrl.all('jobs').getList(),
				this.toolResource.getModules(),
				this.toolResource.getTools()
			];

			return this.$q.all(promises);
		}).then((data: any) => {
			return this.parseSessionData(data);
		});
	}

	getSessions() {
		return this.getService()
			.then((service: IService) => service.all('sessions').getList())
			.then((response: any) => response.data);
	}

	createSession(session: Session) {
		return this.getService()
			.then((service: IService) => service.one('sessions').customPOST(session))
			.then((res: any) => {
				var sessionLocation = res.headers('Location');
				// sessionId
				return sessionLocation.substr(sessionLocation.lastIndexOf('/') + 1);
			});
	}

	createDataset(sessionId: string, dataset: Dataset) {
		return this.getService()
			.then((service: IService) => service.one('sessions', sessionId).one('datasets').customPOST(dataset))
			.then((res: any) => {
				var location = res.headers('Location');
				return location.substr(location.lastIndexOf('/') + 1);
			});
	}

	createJob(sessionId: string, job: Job) {
		return this.getService()
			.then((service: IService) => service.one('sessions', sessionId).one('jobs').customPOST(job));
	}

	getSession(sessionId: string) {
		return this.getService()
			.then((service: IService) => service.one('sessions', sessionId).get())
			.then((resp: any) => resp.data);
	}

	getDataset(sessionId: string, datasetId: string) {
		return this.getService()
			.then((service: IService) => service.one('sessions', sessionId).one('datasets', datasetId).get())
			.then((resp: any) => resp.data);
	}

	getJob(sessionId: string, jobId: string) {
		return this.getService()
			.then((service: IService) => service.one('sessions', sessionId).one('jobs', jobId).get())
			.then((resp: any) => resp.data);
	}

	updateSession(session: Session) {
		return this.getService().then((service: IService) => service
			.one('sessions', session.sessionId)
			.customPUT(session));
	}

	updateDataset(sessionId: string, dataset: Dataset) {
		return this.getService().then((service: IService) => service
			.one('sessions', sessionId)
			.one('datasets', dataset.datasetId)
			.customPUT(dataset));
	}

	updateJob(sessionId: string, job: Job) {
		return this.getService().then((service: IService) => service
			.one('sessions', sessionId)
			.one('datasets', job.jobId)
			.customPUT(job));
	}

	deleteSession(sessionId: string) {
		return this.getService().then((service: IService) => service
			.one('sessions', sessionId)
			.remove());
	}

	deleteDataset(sessionId: string, datasetId: string) {
		return this.getService().then((service: IService) => service
			.one('sessions', sessionId)
			.one('datasets', datasetId)
			.remove());
	}

	deleteJob(sessionId: string, jobId: string) {
		return this.getService().then((service: IService) => service
			.one('sessions', sessionId)
			.one('jobs', jobId)
			.remove());
	}
}