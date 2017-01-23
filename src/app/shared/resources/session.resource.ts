
import * as restangular from "restangular";
import ConfigService from "../services/config.service";
import {ToolResource} from "./toolresource";
import Session from "../../model/session/session";
import Dataset from "../../model/session/dataset";
import Module from "../../model/session/module";
import Tool from "../../model/session/tool";
import Job from "../../model/session/job";
import * as _ from "lodash";
import UtilsService from "../../services/utils.service";
import {TokenService} from "../../core/authentication/token.service";
import {Injectable, Inject} from "@angular/core";
import {SessionData} from "../../model/session/session-data";
import {RestService} from "../../core/rest-services/restservice/rest.service";
import {Observable} from "rxjs";

@Injectable()
export default class SessionResource {

	public service: any;

	constructor(@Inject('Restangular') private restangular: restangular.IService,
				private tokenService: TokenService,
        private configService: ConfigService,
				private toolResource: ToolResource,
        private restService: RestService,
				@Inject('$q') private $q:ng.IQService) {}

	getService() {
		if (!this.service) {
			this.service = this.configService.getSessionDbUrl().toPromise().then((url: string) => {

				let service: any = this.restangular.withConfig((configurer: any) => {
					configurer.setBaseUrl(url);
					// this service is initialized only once, but the Authentication service will update the returned
					// instance when necessary (login & logout) so that the request is always made with the most up-to-date
					// credentials
					configurer.setDefaultHeaders(this.tokenService.getTokenHeader());
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

	loadSession(sessionId: string) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => {

      const session$ = this.restService.get(`${url}/sessions/${sessionId}`, true);
      const sessionDatasets$ = this.restService.get(`${url}/sessions/${sessionId}/datasets`, true);
      const sessionJobs$ = this.restService.get(`${url}/sessions/${sessionId}/jobs`, true);
      const modules$ = this.toolResource.getModules();
      const tools$ = this.toolResource.getTools();

      return Observable.forkJoin([session$, sessionDatasets$, sessionJobs$, modules$, tools$])

    }).map( (param: any) => {
      let session: Session = param[0];
      let datasets: Dataset[] = param[1];
      let jobs: Job[] = param[2];
      let modules: Module[] = param[3];
      let tools: Tool[] = param[4];

      // is there any less ugly syntax for defining the types of anonymous object?
      let data = new SessionData();

      data.session = session;
      data.datasetsMap = UtilsService.arrayToMap(datasets, 'datasetId');
      data.jobsMap = UtilsService.arrayToMap(jobs, 'jobId');

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

      data.modulesMap = UtilsService.arrayToMap(modules, 'moduleId');

      data.modulesMap.forEach( (module:any) => {
        module.categoriesMap = UtilsService.arrayToMap(module.categories, 'name');
      });

      return data;
    });

	}

	getSessions() {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.get(`${url}/sessions`, true));
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
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.get(`${url}/sessions/${sessionId}/datasets/${datasetId}`, true));
	}

	getJob(sessionId: string, jobId: string) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.get(`${url}/sessions/${sessionId}/jobs/${jobId}`, true));
	}

	updateSession(session: Session) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.put(`${url}/sessions/${session.sessionId}`, session, true));
	}

	updateDataset(sessionId: string, dataset: Dataset) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.put(`${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`, dataset, true));
	}

	updateJob(sessionId: string, job: Job) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.put(`${url}/sessions/${sessionId}/jobs/${job.jobId}`, job, true));
	}

	deleteSession(sessionId: string) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.delete(`${url}/sessions/${sessionId}`, true));
	}

	deleteDataset(sessionId: string, datasetId: string): Observable<any> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.delete(`${url}/sessions/${sessionId}/datasets/${datasetId}`, true));
	}

	deleteJob(sessionId: string, jobId: string): Observable<any> {
	  const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.delete(`${url}/sessions/${sessionId}/jobs/${jobId}`, true));
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
						updateRequests.push(this.updateDataset(sessionId, datasetCopy).toPromise());
					}
				});

				// update jobs' inputs' datasetIds
				sessionData.jobsMap.forEach((oldJob: Job) => {
					let jobCopy = _.clone(oldJob);
					jobCopy.jobId = jobIdMap.get(oldJob.jobId);
					jobCopy.inputs.forEach((input) => {
						input.datasetId = datasetIdMap.get(input.datasetId);
						updateRequests.push(this.updateJob(sessionId, jobCopy).toPromise());
					});
				});

				return Promise.all(updateRequests).then(() => {
					console.log('session copied');
				});
			});
		});
	}
}
