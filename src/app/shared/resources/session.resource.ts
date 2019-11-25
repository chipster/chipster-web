import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Dataset, Job, Rule, Session, WorkflowPlan, WorkflowRun } from "chipster-js-common";
import { SessionState } from "chipster-js-common/lib/model/session";
import * as _ from "lodash";
import log from "loglevel";
import { forkJoin, Observable, of as observableOf } from "rxjs";
import { catchError, defaultIfEmpty, map, mergeMap, tap } from "rxjs/operators";
import { TokenService } from "../../core/authentication/token.service";
import { SessionData } from "../../model/session/session-data";
import { ConfigService } from "../services/config.service";
import UtilsService from "../utilities/utils";

@Injectable()
export class SessionResource {
  constructor(
    private configService: ConfigService,
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  loadSession(sessionId: string, preview = false): Observable<SessionData> {
    let types$;

    if (preview) {
      types$ = observableOf(null);
    } else {
      // types are not needed in the preview
      types$ = this.getTypeTagsForSession(sessionId).pipe(
        tap(x => log.debug("types", x))
      );
    }

    // catch all errors to prevent forkJoin from cancelling other requests, which will make ugly server logs
    return this.forkJoinWithoutCancel([
      this.getSession(sessionId, preview),
      this.getDatasets(sessionId),
      this.getJobs(sessionId),
      types$,
      this.getWorkflowPlans(sessionId),
      this.getWorkflowRuns(sessionId)
    ]).pipe(
      map((param: Array<{}>) => {
        const session: Session = param[0] as Session;
        const datasets: Dataset[] = param[1] as Dataset[];
        const jobs: Job[] = param[2] as Job[];
        const types = param[3] as Map<string, Map<string, string>>;
        const workflowPlans = param[4] as WorkflowPlan[];
        const workflowRuns = param[5] as WorkflowRun[];

        const data = new SessionData();

        data.session = session;
        data.datasetsMap = UtilsService.arrayToMap(datasets, "datasetId");
        data.jobsMap = UtilsService.arrayToMap(jobs, "jobId");
        data.workflowPlansMap = UtilsService.arrayToMap(
          workflowPlans,
          "workflowPlanId"
        );
        data.workflowRunsMap = UtilsService.arrayToMap(
          workflowRuns,
          "workflowRunId"
        );

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
    const catchedObservables = observables.map(o =>
      o.pipe(
        catchError(err => {
          errors.push(err);
          return observableOf(null);
        })
      )
    );
    return forkJoin(catchedObservables).pipe(
      map(res => {
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

  getTypeTagsForDataset(
    sessionId: string,
    dataset: Dataset
  ): Observable<Map<string, string>> {
    return this.configService.getTypeService().pipe(
      mergeMap(typeServiceUrl => {
        return this.http.get(
          typeServiceUrl +
            "/sessions/" +
            sessionId +
            "/datasets/" +
            dataset.datasetId,
          this.tokenService.getTokenParams(true)
        );
      }),
      map(typesObj => {
        return this.objectToMap(typesObj[dataset.datasetId]);
      })
    );
  }

  getTypeTagsForSession(
    sessionId: string
  ): Observable<Map<string, Map<string, string>>> {
    return this.configService.getTypeService().pipe(
      mergeMap(typeServiceUrl => {
        return this.http.get(
          typeServiceUrl + "/sessions/" + sessionId,
          this.tokenService.getTokenParams(true)
        );
      }),
      map(typesObj => {
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
        mergeMap((url: string) =>
          this.http.get<Session[]>(
            `${url}/sessions`,
            this.tokenService.getTokenParams(true)
          )
        )
      );
  }

  getExampleSessions(): Observable<Array<Session>> {
    let appId: string;
    return this.configService.get(ConfigService.KEY_APP_ID).pipe(
      tap(id => (appId = id)),
      mergeMap(() => this.configService.getSessionDbUrl()),
      mergeMap((url: string) =>
        this.http.get<Session[]>(
          `${url}/sessions?appId=${appId}`,
          this.tokenService.getTokenParams(true)
        )
      )
    );
  }

  getShares(): Observable<Array<Session>> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap((url: string) =>
          this.http.get<Session[]>(
            `${url}/sessions/shares`,
            this.tokenService.getTokenParams(true)
          )
        )
      );
  }

  createSession(session: Session): Observable<string> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(
          `${url}/sessions/`,
          session,
          this.tokenService.getTokenParams(true)
        )
      ),
      map((response: Session) => response.sessionId)
    );
  }

  createDataset(sessionId: string, dataset: Dataset): Observable<string> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(
          `${url}/sessions/${sessionId}/datasets`,
          dataset,
          this.tokenService.getTokenParams(true)
        )
      ),
      map((response: Dataset) => response.datasetId)
    );
  }

  createDatasets(
    sessionId: string,
    datasets: Dataset[]
  ): Observable<Dataset[]> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(
          `${url}/sessions/${sessionId}/datasets/array`,
          datasets,
          this.tokenService.getTokenParams(true)
        )
      ),
      map((response: {}) => response["datasets"])
    );
  }

  createJob(sessionId: string, job: Job): Observable<string> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(
          `${url}/sessions/${sessionId}/jobs`,
          job,
          this.tokenService.getTokenParams(true)
        )
      ),
      map((response: Job) => response.jobId)
    );
  }

  createJobs(sessionId: string, jobs: Job[]): Observable<Job[]> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(
          `${url}/sessions/${sessionId}/jobs/array`,
          jobs,
          this.tokenService.getTokenParams(true)
        )
      ),
      map((response: {}) => response["jobs"])
    );
  }

  createRule(sessionId: string, rule: Rule): Observable<string> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(
          `${url}/sessions/${sessionId}/rules`,
          rule,
          this.tokenService.getTokenParams(true)
        )
      ),
      map((response: Rule) => response.ruleId)
    );
  }

  createWorkflowRun(sessionId: string, run: WorkflowRun): Observable<string> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(
          `${url}/sessions/${sessionId}/workflows/runs`,
          run,
          this.tokenService.getTokenParams(true)
        )
      ),
      map((response: WorkflowRun) => response.workflowRunId)
    );
  }
  createWorkflowPlan(
    sessionId: string,
    plan: WorkflowPlan
  ): Observable<string> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(
          `${url}/sessions/${sessionId}/workflows/plans`,
          plan,
          this.tokenService.getTokenParams(true)
        )
      ),
      map((response: WorkflowPlan) => response.workflowPlanId)
    );
  }

  createWorkflowPlans(sessionId: string, plans: WorkflowPlan[]): Observable<WorkflowPlan[]> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) =>
        this.http.post(
          `${url}/sessions/${sessionId}/workflows/plans/array`,
          plans,
          this.tokenService.getTokenParams(true)
        )
      ),
      map((response: {}) => response["plans"])
    );
  }

  getSession(sessionId: string, preview = false): Observable<Session> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) => {
        let sessionUrl = url + "/sessions/" + sessionId;
        if (preview) {
          sessionUrl += "?preview";
        }

        return this.http.get<Session>(
          sessionUrl,
          this.tokenService.getTokenParams(true)
        );
      })
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

  getDatasets(sessionId: string): Observable<Dataset[]> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.get(
              `${url}/sessions/${sessionId}/datasets`,
              this.tokenService.getTokenParams(true)
            ) as Observable<Dataset[]>
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

  getJobs(sessionId: string): Observable<Job[]> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.get(
              `${url}/sessions/${sessionId}/jobs`,
              this.tokenService.getTokenParams(true)
            ) as Observable<Job[]>
        )
      );
  }

  getWorkflowRun(sessionId: string, runId: string): Observable<WorkflowRun> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.get(
              `${url}/sessions/${sessionId}/workflows/runs/${runId}`,
              this.tokenService.getTokenParams(true)
            ) as Observable<WorkflowRun>
        )
      );
  }
  getWorkflowPlan(sessionId: string, planId: string): Observable<WorkflowPlan> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.get(
              `${url}/sessions/${sessionId}/workflows/plans/${planId}`,
              this.tokenService.getTokenParams(true)
            ) as Observable<WorkflowPlan>
        )
      );
  }

  getWorkflowPlans(sessionId: string): Observable<WorkflowPlan[]> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.get(
              `${url}/sessions/${sessionId}/workflows/plans`,
              this.tokenService.getTokenParams(true)
            ) as Observable<WorkflowPlan[]>
        )
      );
  }

  getWorkflowRuns(sessionId: string): Observable<WorkflowRun[]> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.get(
              `${url}/sessions/${sessionId}/workflows/runs`,
              this.tokenService.getTokenParams(true)
            ) as Observable<WorkflowRun[]>
        )
      );
  }

  getRule(sessionId: string, ruleId: string): Observable<Rule> {
    return this.configService.getSessionDbUrl().pipe(
      mergeMap((url: string) => {
        return this.http.get(
          `${url}/sessions/${sessionId}/rules/${ruleId}`,
          this.tokenService.getTokenParams(true)
        ) as Observable<Rule>;
      })
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

  updateWorkflowRun(sessionId: string, run: WorkflowRun): Observable<null> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.put(
              `${url}/sessions/${sessionId}/workflows/runs/${run.workflowRunId}`,
              run,
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

  deleteWorkflowRun(sessionId: string, workflowRunId: string): Observable<null> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.delete(
              `${url}/sessions/${sessionId}/workflows/runs/${workflowRunId}`,
              this.tokenService.getTokenParams(true)
            ) as Observable<null>
        )
      );
  }

  deleteWorkflowPlan(
    sessionId: string,
    workflowPlanId: string
  ): Observable<null> {
    return this.configService
      .getSessionDbUrl()
      .pipe(
        mergeMap(
          (url: string) =>
            this.http.delete(
              `${url}/sessions/${sessionId}/workflows/plans/${workflowPlanId}`,
              this.tokenService.getTokenParams(true)
            ) as Observable<null>
        )
      );
  }

  copySession(
    sessionData: SessionData,
    name: string,
    temporary: boolean
  ): Observable<string> {
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

    return createSession$.pipe(
      mergeMap((sessionId: string) => {
        createdSessionId = sessionId;

        const createRequests: Array<Observable<{}>> = [];

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
        return forkJoin(...createRequests).pipe(defaultIfEmpty([]));
      }),
      mergeMap(() => {
        const createRequests: Array<Observable<{}>> = [];

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
        return forkJoin(...createRequests).pipe(defaultIfEmpty([]));
      }),
      mergeMap(() => {
        const createRequests: Array<Observable<{}>> = [];

        // create jobs
        const oldPlans = Array.from(sessionData.workflowPlansMap.values());
        const copies = oldPlans.map((old: WorkflowPlan) => {
          const copy = _.clone(old);
          copy.sessionId = null;
          return copy;
        });

        const request = this.createWorkflowPlans(createdSessionId, copies);
        createRequests.push(request);

        // see the comment of the forkJoin above
        return forkJoin(...createRequests).pipe(defaultIfEmpty([]));
      }),      
      mergeMap(() => this.getSession(createdSessionId)),
      mergeMap(session => {
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
}
