
import AuthenticationService from "../core/authentication/authenticationservice";
import * as restangular from "restangular";
import ConfigService from "../services/config.service";
import ToolResource from "../resources/toolresource";
import Utils from "../services/utils.service";
import Session from "../model/session/session";
import Dataset from "../model/session/dataset";
import Module from "../model/session/module";
import Tool from "../model/session/tool";
import Job from "../model/session/job";
import * as _ from "lodash";

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

		return this.getService().then((service: restangular.IService) => {
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
			.then((service:restangular.IService) => service.all('sessions').getList())
			.then((response: any) => response.data);
	}

	createSession(session: Session) {
		return this.getService()
			.then((service:restangular.IService) => service.one('sessions').customPOST(session))
			.then((res: any) => {
				var sessionLocation = res.headers('Location');
				// sessionId
				return sessionLocation.substr(sessionLocation.lastIndexOf('/') + 1);
			});
	}

	createDataset(sessionId: string, dataset: Dataset) {
		return this.getService()
			.then((service:restangular.IService) => service.one('sessions', sessionId).one('datasets').customPOST(dataset))
			.then((res: any) => {
				var location = res.headers('Location');
				return location.substr(location.lastIndexOf('/') + 1);
			});
	}

	createJob(sessionId: string, job: Job) {
		return this.getService()
			.then((service:restangular.IService) => service.one('sessions', sessionId).one('jobs').customPOST(job))
			.then((res: any) => {
				var location = res.headers('Location');
				return location.substr(location.lastIndexOf('/') + 1);
			});
	}

	getSession(sessionId: string) {
		return this.getService()
			.then((service:restangular.IService) => service.one('sessions', sessionId).get())
			.then((resp: any) => resp.data);
	}

	getDataset(sessionId: string, datasetId: string) {
		return this.getService()
			.then((service:restangular.IService) => service.one('sessions', sessionId).one('datasets', datasetId).get())
			.then((resp: any) => resp.data);
	}

	getJob(sessionId: string, jobId: string) {
		return this.getService()
			.then((service:restangular.IService) => service.one('sessions', sessionId).one('jobs', jobId).get())
			.then((resp: any) => resp.data);
	}

	updateSession(session: Session) {
		return this.getService().then((service:restangular.IService) => service
			.one('sessions', session.sessionId)
			.customPUT(session));
	}

	updateDataset(sessionId: string, dataset: Dataset) {
		return this.getService().then((service:restangular.IService) => service
			.one('sessions', sessionId)
			.one('datasets', dataset.datasetId)
			.customPUT(dataset));
	}

	updateJob(sessionId: string, job: Job) {
		return this.getService().then((service:restangular.IService) => service
			.one('sessions', sessionId)
			.one('jobs', job.jobId)
			.customPUT(job));
	}

	deleteSession(sessionId: string) {
		return this.getService().then((service:restangular.IService) => service
			.one('sessions', sessionId)
			.remove());
	}

	deleteDataset(sessionId: string, datasetId: string) {
		return this.getService().then((service:restangular.IService) => service
			.one('sessions', sessionId)
			.one('datasets', datasetId)
			.remove());
	}

	deleteJob(sessionId: string, jobId: string) {
		return this.getService().then((service:restangular.IService) => service
			.one('sessions', sessionId)
			.one('jobs', jobId)
			.remove());
	}

	copySession(sessionData: SessionData, name: string) {
		let newSession: Session = _.clone(sessionData.session);
		newSession.sessionId = null;
		newSession.name = name;

		// create session
		return this.createSession(newSession).then((sessionId: string) => {

			let datasetIdMap = new Map<string, string>();
			let jobIdMap = new Map<string, string>();

			// create datasets
			let createRequests: Array<Promise<string>> = [];
			sessionData.datasetsMap.forEach((dataset: Dataset) => {
				let datasetCopy = _.clone(dataset);
				datasetCopy.datasetId = null;
				let request = this.createDataset(sessionId, datasetCopy);
				createRequests.push(request);
				request.then((newId: string) => {
					datasetIdMap.set(dataset.datasetId, newId);
				});
			});


			// create jobs
			sessionData.jobsMap.forEach((oldJob: Job) => {
				let jobCopy = _.clone(oldJob);
				jobCopy.jobId = null;
				let request = this.createJob(sessionId, jobCopy);
				createRequests.push(request);
				request.then((newId: string) => {
					jobIdMap.set(oldJob.jobId, newId);
				});
			});

			return Promise.all(createRequests).then(() => {

				let updateRequests: Array<Promise<string>> = [];

				// update datasets' sourceJob id
				sessionData.datasetsMap.forEach((oldDataset: Dataset) => {
					let sourceJobId = oldDataset.sourceJob;
					if (sourceJobId) {
						let datasetCopy = _.clone(oldDataset);
						datasetCopy.datasetId = datasetIdMap.get(oldDataset.datasetId);
						datasetCopy.sourceJob = jobIdMap.get(sourceJobId);
						updateRequests.push(this.updateDataset(sessionId, datasetCopy));
					}
				});

				// update jobs' inputs' datasetIds
				sessionData.jobsMap.forEach((oldJob: Job) => {
					let jobCopy = _.clone(oldJob);
					jobCopy.jobId = jobIdMap.get(oldJob.jobId);
					jobCopy.inputs.forEach((input) => {
						input.datasetId = datasetIdMap.get(input.datasetId);
						updateRequests.push(this.updateJob(sessionId, jobCopy));
					});
				});

				return Promise.all(updateRequests).then(() => {
					console.log('session copied');
				});
			});
		});
	}
}
