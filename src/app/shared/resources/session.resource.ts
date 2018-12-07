import { ConfigService } from "../services/config.service";
import { ToolResource } from "./tool-resource";
import { Session, Dataset, Job, Rule } from "chipster-js-common";
import * as _ from "lodash";
import UtilsService from "../utilities/utils";
import { Injectable } from "@angular/core";
import { SessionData } from "../../model/session/session-data";
import { RestService } from "../../core/rest-services/restservice/rest.service";
import { Observable } from "rxjs/Observable";
import log from "loglevel";
import { SessionState } from "chipster-js-common/lib/model/session";

@Injectable()
export class SessionResource {
  constructor(
    private configService: ConfigService,
    private toolResource: ToolResource,
    private restService: RestService
  ) {}

  loadSession(sessionId: string, preview = false): Observable<SessionData> {
    return this.configService
      .getSessionDbUrl()
      .flatMap((url: string) => {

        let sessionUrl = `${url}/sessions/${sessionId}`;
        let types$;

        if (preview) {
          sessionUrl += '?preview';
          types$ = Observable.of(null);
        } else {
          // types are not needed in the preview
          types$ = this.getTypeTagsForSession(sessionId)
            .do((x: any) => log.debug("types", x));
        }

        const session$ = this.restService
          .get(sessionUrl, true)
          .do((x: any) => log.debug("session", x));
        const sessionDatasets$ = this.restService
          .get(`${url}/sessions/${sessionId}/datasets`, true)
          .do((x: any) => log.debug("sessionDatasets", x));
        const sessionJobs$ = this.restService
          .get(`${url}/sessions/${sessionId}/jobs`, true)
          .do((x: any) => log.debug("sessionJobs", x));

        // catch all errors to prevent forkJoin from cancelling other requests, which will make ugly server logs
        return this.forkJoinWithoutCancel([
          session$,
          sessionDatasets$,
          sessionJobs$,
          types$
        ]);
      })
      .map((param: any) => {
        const session: Session = param[0];
        const datasets: Dataset[] = param[1];
        const jobs: Job[] = param[2];
        const types = param[3];

        const data = new SessionData();

        data.session = session;
        data.datasetsMap = UtilsService.arrayToMap(datasets, "datasetId");
        data.jobsMap = UtilsService.arrayToMap(jobs, "jobId");

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
    const errors = [];
    const catchedObservables = observables.map(o =>
      o.catch(err => {
        errors.push(err);
        return Observable.of(null);
      })
    );
    return Observable.forkJoin(catchedObservables).map(res => {
      if (errors.length > 0) {
        log.warn("session loading failed", errors);
        // just report the first error, this is what the forkJoin would have done by default anyway
        throw errors[0];
      } else {
        return res;
      }
    });
  }

  getTypeTagsForDataset(sessionId: string, dataset: Dataset) {
    return this.configService
      .getTypeService()
      .flatMap(typeServiceUrl => {
        return this.restService.get(
          typeServiceUrl +
            "/sessions/" +
            sessionId +
            "/datasets/" +
            dataset.datasetId,
          true
        );
      })
      .map(typesObj => {
        return this.objectToMap(typesObj[dataset.datasetId]);
      });
  }

  getTypeTagsForSession(sessionId: string) {
    return this.configService
      .getTypeService()
      .flatMap(typeServiceUrl => {
        return this.restService.get(
          typeServiceUrl + "/sessions/" + sessionId,
          true
        );
      })
      .map(typesObj => {
        // convert js objects to es6 Maps
        const typesMap = new Map();
        for (const datasetId of Object.keys(typesObj)) {
          typesMap.set(datasetId, this.objectToMap(typesObj[datasetId]));
        }
        return typesMap;
      });
  }

  objectToMap(obj) {
    const map = new Map();
    for (const key of Object.keys(obj)) {
      map.set(key, obj[key]);
    }
    return map;
  }

  getSessions(): Observable<Array<Session>> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) =>
      this.restService.get(`${url}/sessions`, true)
    );
  }

  createSession(session: Session): Observable<string> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$
      .flatMap((url: string) =>
        this.restService.post(`${url}/sessions/`, session, true)
      )
      .map((response: any) => response.sessionId);
  }

  createDataset(sessionId: string, dataset: Dataset): Observable<string> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$
      .flatMap((url: string) =>
        this.restService.post(
          `${url}/sessions/${sessionId}/datasets`,
          dataset,
          true
        )
      )
      .map((response: any) => response.datasetId);
  }

  createDatasets(
    sessionId: string,
    datasets: Dataset[]
  ): Observable<Dataset[]> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$
      .flatMap((url: string) =>
        this.restService.post(
          `${url}/sessions/${sessionId}/datasets/array`,
          datasets,
          true
        )
      )
      .map((response: any) => response.datasets);
  }

  createJob(sessionId: string, job: Job): Observable<string> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$
      .flatMap((url: string) =>
        this.restService.post(`${url}/sessions/${sessionId}/jobs`, job, true)
      )
      .map((response: any) => response.jobId);
  }

  createJobs(sessionId: string, jobs: Job[]): Observable<Job[]> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$
      .flatMap((url: string) =>
        this.restService.post(
          `${url}/sessions/${sessionId}/jobs/array`,
          jobs,
          true
        )
      )
      .map((response: any) => response.jobs);
  }

  createRule(sessionId: string, rule: Rule): Observable<string> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$
      .flatMap((url: string) =>
        this.restService.post(`${url}/sessions/${sessionId}/rules`, rule, true)
      )
      .map((response: any) => response.ruleId);
  }

  getSession(sessionId: string): Observable<Session> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) =>
      this.restService.get(`${url}/sessions/${sessionId}`, true)
    );
  }

  getDataset(sessionId: string, datasetId: string) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) =>
      this.restService.get(
        `${url}/sessions/${sessionId}/datasets/${datasetId}`,
        true
      )
    );
  }

  getJob(sessionId: string, jobId: string) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) =>
      this.restService.get(`${url}/sessions/${sessionId}/jobs/${jobId}`, true)
    );
  }

  getRule(sessionId: string, ruleId: string) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) => {
      return this.restService.get(
        `${url}/sessions/${sessionId}/rules/${ruleId}`,
        true
      );
    });
  }

  updateSession(session: Session) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) =>
      this.restService.put(
        `${url}/sessions/${session.sessionId}`,
        session,
        true
      )
    );
  }

  updateDataset(sessionId: string, dataset: Dataset) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) =>
      this.restService.put(
        `${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`,
        dataset,
        true
      )
    );
  }

  updateDatasets(sessionId: string, datasets: Dataset[]) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) =>
      this.restService.put(
        `${url}/sessions/${sessionId}/datasets/array`,
        datasets,
        true
      )
    );
  }

  updateJob(sessionId: string, job: Job) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) =>
      this.restService.put(
        `${url}/sessions/${sessionId}/jobs/${job.jobId}`,
        job,
        true
      )
    );
  }

  deleteSession(sessionId: string) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) =>
      this.restService.delete(`${url}/sessions/${sessionId}`, true)
    );
  }

  deleteRule(sessionId: string, ruleId: string) {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) =>
      this.restService.delete(
        `${url}/sessions/${sessionId}/rules/${ruleId}`,
        true
      )
    );
  }

  deleteDataset(sessionId: string, datasetId: string): Observable<any> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) =>
      this.restService.delete(
        `${url}/sessions/${sessionId}/datasets/${datasetId}`,
        true
      )
    );
  }

  deleteJob(sessionId: string, jobId: string): Observable<any> {
    const apiUrl$ = this.configService.getSessionDbUrl();
    return apiUrl$.flatMap((url: string) =>
      this.restService.delete(
        `${url}/sessions/${sessionId}/jobs/${jobId}`,
        true
      )
    );
  }

  copySession(sessionData: SessionData, name: string, temporary: boolean): Observable<any> {
    log.info("copySession()", sessionData, name, temporary);
    if (!name) {
      name = "unnamed session";
    }

    const newSession: Session = _.clone(sessionData.session);
    newSession.sessionId = null;
    newSession.name = name;
    newSession.state = SessionState.Import;
    let createdSessionId: string;

    // create session
    const createSession$ = this.createSession(newSession);

    return createSession$
      .flatMap((sessionId: string) => {
        createdSessionId = sessionId;

        const createRequests: Array<Observable<any>> = [];

        // create datasets
        const oldDatasets = Array.from(sessionData.datasetsMap.values());
        const clones = oldDatasets.map((dataset: Dataset) => {
          const clone = _.clone(dataset);
          clone.sessionId = null;
          return clone;
        });

        const request = this.createDatasets(createdSessionId, clones);
        createRequests.push(request);

        // emit an empty array if the forkJoin completes without emitting anything
        // otherwise this won't continue to the next flatMap() when the session is empty
        return Observable.forkJoin(...createRequests).defaultIfEmpty([]);
      })
      .flatMap(() => {
        const createRequests: Array<Observable<any>> = [];

        // create jobs
        const oldJobs = Array.from(sessionData.jobsMap.values());
        const jobCopies = oldJobs.map((oldJob: Job) => {
          const jobCopy = _.clone(oldJob);
          jobCopy.sessionId = null;
          return jobCopy;
        });

        const request = this.createJobs(createdSessionId, jobCopies);
        createRequests.push(request);

        // see the comment of the forkJoin above
        return Observable.forkJoin(...createRequests).defaultIfEmpty([]);
      })
      .flatMap(() => this.getSession(createdSessionId))
      .flatMap(session => {
        log.info("session copied, current state", session.state, temporary);
        if (temporary) {
          session.state = SessionState.Temporary;
        } else {
          session.state = SessionState.Ready;
        }
        log.info("set to", session.state);
        return this.updateSession(session);
      })
      .map(() => createdSessionId);
  }
}
