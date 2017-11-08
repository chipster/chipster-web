
import {ConfigService} from "../services/config.service";
import {ToolResource} from "./toolresource";
import Session from "../../model/session/session";
import Dataset from "../../model/session/dataset";
import Module from "../../model/session/module";
import Tool from "../../model/session/tool";
import Job from "../../model/session/job";
import * as _ from "lodash";
import UtilsService from "../utilities/utils";
import {Injectable} from "@angular/core";
import {SessionData} from "../../model/session/session-data";
import {RestService} from "../../core/rest-services/restservice/rest.service";
import {Observable} from "rxjs";
import {ErrorService} from "../../views/error/error.service";

@Injectable()
export class SessionResource {

	constructor(private configService: ConfigService,
				private toolResource: ToolResource,
        private restService: RestService,
        private errorService: ErrorService) {}

	loadSession(sessionId: string) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => {

      // catch all errors to prevent forkJoin from cancelling other requests, which will make ugly server logs
      const session$ = this.restService.get(`${url}/sessions/${sessionId}`, true)
        .do((x: any) => console.debug('session', x));
      const sessionDatasets$ = this.restService.get(`${url}/sessions/${sessionId}/datasets`, true)
        .do((x: any) => console.debug('sessionDatasets', x));
      const sessionJobs$ = this.restService.get(`${url}/sessions/${sessionId}/jobs`, true)
        .do((x: any) => console.debug('sessionJobs', x));
      const modules$ = this.toolResource.getModules()
        .do((x: any) => console.debug('modules', x));
      const tools$ = this.toolResource.getTools()
        .do((x: any) => console.debug('tools', x));
      const types$ = this.getTypeTagsForSession(sessionId)
        .do((x: any) => console.debug('types', x));

      return this.forkJoinWithoutCancel([session$, sessionDatasets$, sessionJobs$, modules$, tools$, types$]);

    }).map( (param: any) => {

      let session: Session = param[0];
      let datasets: Dataset[] = param[1];
      let jobs: Job[] = param[2];
      let modules: Module[] = param[3];
      let tools: Tool[] = param[4];
      let types = param[5];

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

      data.datasetTypeTags = types;

      return data;
    });
	}

  /**
   * forkJoin without cancellation
   *
   * By default, forkJoin() cancels all other requests when one of them fails, which creates
   * ugly Broken pipe exceptions on the server. This method disables the cancellation functionality
   * by hiding the failures from the forkJoin() and handling them here afterwards.
   *
   * @param observables
   * @returns {Observable<any>}
   */
	forkJoinWithoutCancel(observables) {
	  let errors = [];
	  let catchedObservables = observables.map(o => o.catch(err => {
	    errors.push(err);
	    return Observable.of(null);
    }));
	  return Observable.forkJoin(catchedObservables).map(res => {
	    if (errors.length > 0) {
	      console.log('session loading failed', errors);
	      // just report the first error, this is what the forkJoin would have done by default anyway
	      throw errors[0];
      } else {
	      return res;
      }
    });
  }

	getTypeTagsForDataset(sessionId: string, dataset: Dataset) {

    return this.configService.getTypeService()
      .flatMap(typeServiceUrl => {
        return this.restService.get(typeServiceUrl + '/sessions/' + sessionId + '/datasets/' + dataset.datasetId, true);
      }).map(typesObj => {
        return this.objectToMap(typesObj[dataset.datasetId]);
      });
  }

	getTypeTagsForSession(sessionId: string) {

    return this.configService.getTypeService().flatMap(typeServiceUrl => {
      return this.restService.get(typeServiceUrl + '/sessions/' + sessionId, true);
    }).map(typesObj => {
      // convert js objects to es6 Maps
      let typesMap = new Map();
      for (let datasetId of Object.keys(typesObj)) {
        typesMap.set(datasetId, this.objectToMap(typesObj[datasetId]));
      }
      return typesMap;
    });
  }

  objectToMap(obj) {
    let map = new Map();
    for (let key of Object.keys(obj)) {
      map.set(key, obj[key]);
    }
    return map;
  }

	getSessions(): Observable<Array<Session>> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.get(`${url}/sessions`, true));
	}

	createSession(session: Session): Observable<string> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.post(`${url}/sessions/`, session, true))
      .map( (response: any) => response.sessionId);
	}

	createDataset(sessionId: string, dataset: Dataset): Observable<string> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.post(`${url}/sessions/${sessionId}/datasets`, dataset, true))
      .map( (response: any) => response.datasetId);
	}

	createJob(sessionId: string, job: Job): Observable<string> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.post(`${url}/sessions/${sessionId}/jobs`, job, true))
      .map( (response: any) => response.jobId);
	}

	getSession(sessionId: string): Observable<Session> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.get(`${url}/sessions/${sessionId}`, true));
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

  deleteRule(sessionId: string, ruleId: string) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.delete(`${url}/sessions/${sessionId}/rules/${ruleId}`, true));
  }

	deleteDataset(sessionId: string, datasetId: string): Observable<any> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.delete(`${url}/sessions/${sessionId}/datasets/${datasetId}`, true));
	}

	deleteJob(sessionId: string, jobId: string): Observable<any> {
	  const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap( (url: string) => this.restService.delete(`${url}/sessions/${sessionId}/jobs/${jobId}`, true));
	}

	copySession(sessionData: SessionData, name: string): Observable<any> {
		let newSession: Session = _.clone(sessionData.session);
		newSession.sessionId = null;
		newSession.name = name;
    let createdSessionId: string;
    let datasetIdMap = new Map<string, string>();
    let jobIdMap = new Map<string, string>();

    // create session
    const createSession$ = this.createSession(newSession);

    const createDatasetsAndDatasets$ = createSession$.flatMap( (sessionId: string) => {
      createdSessionId = sessionId;

      let createRequests: Array<Observable<string>> = [];

      // create datasets
      sessionData.datasetsMap.forEach((dataset: Dataset) => {
        let datasetCopy = _.clone(dataset);
        datasetCopy.datasetId = null;
        let request = this.createDataset(createdSessionId, datasetCopy);
        createRequests.push(request);
        request.subscribe((newId: string) => {
          datasetIdMap.set(dataset.datasetId, newId);
        });
      });

      // create jobs
      sessionData.jobsMap.forEach((oldJob: Job) => {
        let jobCopy = _.clone(oldJob);
        jobCopy.jobId = null;
        let request = this.createJob(createdSessionId, jobCopy);
        createRequests.push(request);
        request.subscribe((newId: string) => {
          jobIdMap.set(oldJob.jobId, newId);
        });
      });

      return Observable.forkJoin(...createRequests);
    });

    return createDatasetsAndDatasets$.flatMap( () => {
      let updateRequests: Array<Observable<string>> = [];

      // // update datasets' sourceJob id
      sessionData.datasetsMap.forEach((oldDataset: Dataset) => {
        let sourceJobId = oldDataset.sourceJob;
        if (sourceJobId) {
          let datasetCopy = _.clone(oldDataset);
          datasetCopy.datasetId = datasetIdMap.get(oldDataset.datasetId);
          datasetCopy.sourceJob = jobIdMap.get(sourceJobId);
          updateRequests.push(this.updateDataset(createdSessionId, datasetCopy));
        }
      });

      // update jobs' inputs' datasetIds
      sessionData.jobsMap.forEach((oldJob: Job) => {
        let jobCopy = _.clone(oldJob);
        jobCopy.jobId = jobIdMap.get(oldJob.jobId);
        jobCopy.inputs.forEach((input) => {
          input.datasetId = datasetIdMap.get(input.datasetId);
          updateRequests.push(this.updateJob(createdSessionId, jobCopy));
        });
      });

      return Observable.forkJoin(...updateRequests);
    });
	}
}
