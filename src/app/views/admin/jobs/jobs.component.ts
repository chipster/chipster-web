import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Job, JobState } from "chipster-js-common";
import log from "loglevel";
import { forkJoin, Observable, of } from "rxjs";
import { catchError, flatMap, tap } from "rxjs/operators";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { IdPair } from "../../../model/id-pair";
import { SessionResource } from "../../../shared/resources/session.resource";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";
import { JobService } from "../../sessions/session/job.service";

@Component({
  selector: "ch-jobs",
  templateUrl: "./jobs.component.html",
  styleUrls: ["./jobs.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class JobsComponent implements OnInit {
  jobs: Job[];

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private authHttpClient: AuthHttpClientService,
    private sessionResource: SessionResource
  ) {}

  ngOnInit() {
    this.update();
  }

  update() {
    this.jobs = [];

    let sessionDbUrl;

    // do is replaced with tap in rxjs v6, check jobList
    this.configService
      .getSessionDbUrl()
      .pipe(tap((url) => (sessionDbUrl = url)))
      .pipe(
        flatMap((url) => {
          const newJobs$: Observable<IdPair[]> = <any>this.authHttpClient.getAuth(url + "/jobs?state=NEW");
          const waitingJobs$: Observable<IdPair[]> = <any>this.authHttpClient.getAuth(url + "/jobs?state=WAITING");
          const scheduledJobs$: Observable<IdPair[]> = <any>this.authHttpClient.getAuth(url + "/jobs?state=SCHEDULED");
          const runningJobs$: Observable<IdPair[]> = <any>this.authHttpClient.getAuth(url + "/jobs?state=RUNNING");
          return forkJoin(newJobs$, waitingJobs$, scheduledJobs$, runningJobs$);
        })
      )
      .pipe(
        flatMap((newAndRunningJobs) => {
          const newJobs = newAndRunningJobs[0];
          const waitingJobs = newAndRunningJobs[1];
          const scheduledJobs = newAndRunningJobs[2];
          const runningJobs = newAndRunningJobs[3];
          const jobIds = newJobs.concat(waitingJobs).concat(scheduledJobs).concat(runningJobs);
          const jobs$: Observable<Job>[] = jobIds.map(
            (idPair) =>
              <any>(
                this.authHttpClient
                  .getAuth(sessionDbUrl + "/sessions/" + idPair.sessionId + "/jobs/" + idPair.jobId)
                  .pipe(
                    catchError((err) => {
                      log.error("failed to get a job", err);
                      const job = new Job();
                      job.state = JobState.Error;
                      job.stateDetail = "Admin view error, see console";
                      return of(job);
                    })
                  )
              )
          );
          return forkJoin(jobs$);
        })
      )
      .subscribe(
        (jobs) => {
          this.jobs = jobs;
        },
        (err) => this.restErrorService.showError("get jobs failed", err)
      );
  }

  isRunning(job: Job) {
    return JobService.isRunning(job);
  }
  cancelJob(job: Job) {
    const jobCopy = { ...job };
    this.sessionResource.cancelJob(job.sessionId, jobCopy).subscribe({
      next: () => this.update(),
      error: (err) => {
        if (err.error) {
          // server sends a good error message if the job has already finished
          this.restErrorService.showError("cancel job failed: " + err.error, err);
        } else {
          this.restErrorService.showError("cancel job failed", err);
        }
      },
    });
  }
}
