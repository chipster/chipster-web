import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Dataset, Job, JobState, Rule, Session } from "chipster-js-common";
import { SessionState } from "chipster-js-common/lib/model/session";
import * as _ from "lodash";
import log from "loglevel";
import { forkJoin, Observable, of as observableOf, of } from "rxjs";
import { catchError, defaultIfEmpty, map, mergeMap, tap } from "rxjs/operators";
import { TokenService } from "../../core/authentication/token.service";
import { SessionData } from "../../model/session/session-data";
import { JobService } from "../../views/sessions/session/job.service";
import { ConfigService } from "../services/config.service";
import UtilsService from "../utilities/utils";

@Injectable()
export class SessionResource {
  constructor(private configService: ConfigService, private http: HttpClient, private tokenService: TokenService) {}

  loadSession(sessionId: string, preview = false): Observable<SessionData> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) => {
        let sessionUrl = `${url}/sessions/${sessionId}`;
        let types$;

        if (preview) {
          sessionUrl += "?preview";
          types$ = observableOf(null);
        } else {
          // types are not needed in the preview
          types$ = this.getTypeTagsForSession(sessionId).pipe(tap((x) => log.debug("types", x)));
        }

        const session$ = this.http
          .get(sessionUrl, this.tokenService.getTokenParams(true))
          .pipe(tap((x) => log.debug("session", x)));
        const sessionDatasets$ = this.http
          .get(`${url}/sessions/${sessionId}/datasets`, this.tokenService.getTokenParams(true))
          .pipe(tap((x) => log.debug("sessionDatasets", x)));
        const sessionJobs$ = this.http
          .get(`${url}/sessions/${sessionId}/jobs`, this.tokenService.getTokenParams(true))
          .pipe(tap((x) => log.debug("sessionJobs", x)));

        // catch all errors to prevent forkJoin from cancelling other requests, which will make ugly server logs
        return this.forkJoinWithoutCancel([session$, sessionDatasets$, sessionJobs$, types$]);
      }),
      map((param: Array<{}>) => {
        const session: Session = param[0] as Session;
        const datasets: Dataset[] = param[1] as Dataset[];
        const jobs: Job[] = param[2] as Job[];
        const types = param[3] as Map<string, Map<string, string>>;

        const data = new SessionData();

        data.session = session;
        data.datasetsMap = UtilsService.arrayToMap(datasets, "datasetId");
        data.jobsMap = UtilsService.arrayToMap(jobs, "jobId");

        data.datasetTypeTags = types;

        return data;
      })
    );
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
  forkJoinWithoutCancel(observables): Observable<Array<{}>> {
    const errors = [];
    const catchedObservables = observables.map((o) =>
      o.pipe(
        catchError((err) => {
          errors.push(err);
          return observableOf(null);
        })
      )
    );
    return forkJoin(catchedObservables).pipe(
      map((res) => {
        if (errors.length > 0) {
          log.warn("session loading failed", errors);
          // just report the first error, this is what the forkJoin would have done by default anyway
          throw errors[0];
        } else {
          return res;
        }
      })
    );
  }

  getTypeTagsForDataset(sessionId: string, dataset: Dataset): Observable<Map<string, string>> {
    return this.configService.getTypeService().pipe(
      mergeMap((typeServiceUrl) =>
        this.http.get(
          typeServiceUrl + "/sessions/" + sessionId + "/datasets/" + dataset.datasetId,
          this.tokenService.getTokenParams(true)
        )
      ),
      map((typesObj) => this.objectToMap(typesObj[dataset.datasetId]))
    );
  }

  getTypeTagsForSession(sessionId: string): Observable<Map<string, Map<string, string>>> {
    return this.configService.getTypeService().pipe(
      mergeMap((typeServiceUrl) =>
        this.http.get(typeServiceUrl + "/sessions/" + sessionId, this.tokenService.getTokenParams(true))
      ),
      map((typesObj) => {
        // convert js objects to es6 Maps
        const typesMap = new Map();
        for (const datasetId of Object.keys(typesObj)) {
          typesMap.set(datasetId, this.objectToMap(typesObj[datasetId]));
        }
        return typesMap;
      })
    );
  }

  objectToMap(obj: {}): Map<string, string> {
    const objMap = new Map();
    for (const key of Object.keys(obj)) {
      objMap.set(key, obj[key]);
    }
    return objMap;
  }

  getSessions(): Observable<Array<Session>> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap((url: string) => this.http.get<Session[]>(`${url}/sessions`, this.tokenService.getTokenParams(true)))
      );
  }

  getExampleSessions(): Observable<Array<Session>> {
    let appId: string;
    return this.configService.get(ConfigService.KEY_APP_ID).pipe(
      tap((id) => (appId = id)),
      mergeMap(() => this.configService.getSessionDbUrl()),
      mergeMap((url: string) =>
        this.http.get<Session[]>(`${url}/sessions?appId=${appId}`, this.tokenService.getTokenParams(true))
      )
    );
  }

  getShares(): Observable<Array<Session>> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap((url: string) =>
          this.http.get<Session[]>(`${url}/sessions/shares`, this.tokenService.getTokenParams(true))
        )
      );
  }

  createSession(session: Session): Observable<string> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) => this.http.post(`${url}/sessions/`, session, this.tokenService.getTokenParams(true))),
      map((response: Session) => response.sessionId)
    );
  }

  createDataset(sessionId: string, dataset: Dataset): Observable<string> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(`${url}/sessions/${sessionId}/datasets`, dataset, this.tokenService.getTokenParams(true))
      ),
      map((response: Dataset) => response.datasetId)
    );
  }

  createDatasets(sessionId: string, datasets: Dataset[]): Observable<Dataset[]> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(`${url}/sessions/${sessionId}/datasets/array`, datasets, this.tokenService.getTokenParams(true))
      ),
      map((response: {}) => response["datasets"])
    );
  }

  createJob(sessionId: string, job: Job): Observable<string> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(`${url}/sessions/${sessionId}/jobs`, job, this.tokenService.getTokenParams(true))
      ),
      map((response: Job) => response.jobId)
    );
  }

  createJobs(sessionId: string, jobs: Job[]): Observable<Job[]> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(`${url}/sessions/${sessionId}/jobs/array`, jobs, this.tokenService.getTokenParams(true))
      ),
      map((response: {}) => response["jobs"])
    );
  }

  createRule(sessionId: string, rule: Rule): Observable<string> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(`${url}/sessions/${sessionId}/rules`, rule, this.tokenService.getTokenParams(true))
      ),
      map((response: Rule) => response.ruleId)
    );
  }

  getSession(sessionId: string): Observable<Session> {
    log.info("trying to get the session");
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap((url: string) =>
          this.http.get<Session>(`${url}/sessions/${sessionId}`, this.tokenService.getTokenParams(true))
        )
      );
  }

  getDataset(sessionId: string, datasetId: string): Observable<Dataset> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.get(
              `${url}/sessions/${sessionId}/datasets/${datasetId}`,
              this.tokenService.getTokenParams(true)
            ) as Observable<Dataset>
        )
      );
  }

  getJob(sessionId: string, jobId: string): Observable<Job> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.get(
              `${url}/sessions/${sessionId}/jobs/${jobId}`,
              this.tokenService.getTokenParams(true)
            ) as Observable<Job>
        )
      );
  }

  getRule(sessionId: string, ruleId: string): Observable<Rule> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.get(
              `${url}/sessions/${sessionId}/rules/${ruleId}`,
              this.tokenService.getTokenParams(true)
            ) as Observable<Rule>
        )
      );
  }

  updateSession(session: Session): Observable<null> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.put(
              `${url}/sessions/${session.sessionId}`,
              session,
              this.tokenService.getTokenParams(false)
            ) as Observable<null>
        )
      );
  }

  updateDataset(sessionId: string, dataset: Dataset): Observable<null> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.put(
              `${url}/sessions/${sessionId}/datasets/${dataset.datasetId}`,
              dataset,
              this.tokenService.getTokenParams(false)
            ) as Observable<null>
        )
      );
  }

  updateRule(sessionId: string, rule: Rule): Observable<null> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.put(
              `${url}/sessions/${sessionId}/rules/${rule.ruleId}`,
              rule,
              this.tokenService.getTokenParams(false)
            ) as Observable<null>
        )
      );
  }

  updateDatasets(sessionId: string, datasets: Dataset[]): Observable<null> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.put(
              `${url}/sessions/${sessionId}/datasets/array`,
              datasets,
              this.tokenService.getTokenParams(true)
            ) as Observable<null>
        )
      );
  }

  updateJob(sessionId: string, job: Job): Observable<null> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.put(
              `${url}/sessions/${sessionId}/jobs/${job.jobId}`,
              job,
              this.tokenService.getTokenParams(true)
            ) as Observable<null>
        )
      );
  }

  deleteSession(sessionId: string): Observable<null> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.delete(
              `${url}/sessions/${sessionId}`,
              this.tokenService.getTokenParams(false)
            ) as Observable<null>
        )
      );
  }

  deleteRule(sessionId: string, ruleId: string): Observable<null> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.delete(
              `${url}/sessions/${sessionId}/rules/${ruleId}`,
              this.tokenService.getTokenParams(false)
            ) as Observable<null>
        )
      );
  }

  deleteDataset(sessionId: string, datasetId: string): Observable<null> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.delete(
              `${url}/sessions/${sessionId}/datasets/${datasetId}`,
              this.tokenService.getTokenParams(false)
            ) as Observable<null>
        )
      );
  }

  deleteJob(sessionId: string, jobId: string): Observable<null> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.delete(
              `${url}/sessions/${sessionId}/jobs/${jobId}`,
              this.tokenService.getTokenParams(true)
            ) as Observable<null>
        )
      );
  }

  copySession(sessionData: SessionData, name: string, temporary: boolean): Observable<string> {
    log.info(
      "copying session, original has:",
      sessionData.datasetsMap.size,
      "datasets,",
      sessionData.jobsMap.size,
      "jobs"
    );
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

    return createSession$.pipe(
      mergeMap((sessionId: string) => {
        createdSessionId = sessionId;

        // create datasets
        const oldDatasets = Array.from(sessionData.datasetsMap.values());
        const clones = oldDatasets.map((dataset: Dataset) => {
          const clone = _.clone(dataset);
          clone.sessionId = null;
          return clone;
        });

        const createDatasetsRequest = clones.length > 0 ? this.createDatasets(createdSessionId, clones) : of([]);

        // emit an empty array in case request completes without emitting anything
        // (don't know if this ever happends) otherwise this won't continue to the
        //  next mergeMap() when the session is empty
        return createDatasetsRequest.pipe(defaultIfEmpty([]));
      }),
      mergeMap((createdDatasets: Dataset[]) => {
        log.info("created", createdDatasets.length, "datasets");
        // create dataset map for checking inputs later
        const newDatasetsMap: Map<string, Dataset> = createdDatasets.reduce((tempMap, dataset) => {
          tempMap.set(dataset.datasetId, dataset);
          return tempMap;
        }, new Map());

        // create jobs
        const oldJobs = Array.from(sessionData.jobsMap.values());
        const jobCopies = oldJobs
          .filter((oldJob) => !JobService.isRunning(oldJob))
          .map((oldJob: Job) => {
            const jobCopy = _.clone(oldJob);
            jobCopy.sessionId = null;
            this.nullifyMissingInputs(jobCopy, newDatasetsMap);
            return jobCopy;
          });

        const createJobsRequest = jobCopies.length > 0 ? this.createJobs(createdSessionId, jobCopies) : of([]);

        // see the comment of the forkJoin above
        return createJobsRequest.pipe(defaultIfEmpty([]));
      }),
      mergeMap((createdJobs: Job[]) => {
        log.info("created", createdJobs.length, "jobs");
        return this.getSession(createdSessionId);
      }),
      mergeMap((session) => {
        log.info("session copied, current state", session.state, temporary);
        if (temporary) {
          session.state = SessionState.TemporaryUnmodified;
        } else {
          session.state = SessionState.Ready;
        }
        log.info("set to", session.state);
        return this.updateSession(session);
      }),
      map(() => createdSessionId)
    );
  }

  private nullifyMissingInputs(job: Job, datasetsMap: Map<string, Dataset>): void {
    if (job.inputs != null) {
      job.inputs = job.inputs.filter((input) => {
        if (!datasetsMap.has(input.datasetId)) {
          log.info("missing dataset, nullifying input dataset", job.toolName, input.inputId);
        }
        return datasetsMap.has(input.datasetId);
      });
    }
  }

  cancelJob(sessionId: string, job: Job) {
    job.state = JobState.Cancelled;
    job.stateDetail = "";

    return this.updateJob(sessionId, job);
  }
}
