import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Job, JobState } from "chipster-js-common";
import { forkJoin, Observable, of } from "rxjs";
import { flatMap, tap, catchError } from "rxjs/operators";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { IdPair } from "../../../model/id-pair";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";
import log from "loglevel";

@Component({
  selector: "ch-jobs",
  templateUrl: "./jobs.component.html",
  styleUrls: ["./jobs.component.less"],
  encapsulation: ViewEncapsulation.Emulated
})
export class JobsComponent implements OnInit {
  jobs: Job[];

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private authHttpClient: AuthHttpClientService
  ) {}

  ngOnInit() {
    this.jobs = [];

    let sessionDbUrl;

    // do is replaced with tap in rxjs v6, check jobList
    this.configService
      .getSessionDbUrl()
      .pipe(tap(url => (sessionDbUrl = url)))
      .pipe(
        flatMap(url => {
          const newJobs$: Observable<IdPair[]> = <any>(
            this.authHttpClient.getAuth(url + "/jobs?state=NEW")
          );
          const runningJobs$: Observable<IdPair[]> = <any>(
            this.authHttpClient.getAuth(url + "/jobs?state=RUNNING")
          );
          return forkJoin(newJobs$, runningJobs$);
        })
      )
      .pipe(
        flatMap(newAndRunningJobs => {
          const newJobs = newAndRunningJobs[0];

          const runningJobs = newAndRunningJobs[1];
          const jobIds = newJobs.concat(runningJobs);
          const jobs$: Observable<Job>[] = jobIds.map(
            idPair =>
              <any>(
                this.authHttpClient.getAuth(
                  sessionDbUrl +
                    "/sessions/" +
                    idPair.sessionId +
                    "/jobs/" +
                    idPair.jobId
                ).pipe(
                  catchError(err => {
                    log.error("failed to get a job", err);
                    let job = new Job();
                    job.state = JobState.Error;
                    job.stateDetail = "Admin view error, see console";
                    return of(job);
                  }),
                )
              )
          );
          return forkJoin(jobs$);
        })
      )
      .subscribe(
        jobs => {
          this.jobs = jobs;
        },
        err => this.restErrorService.showError("get jobs failed", err)
      );
  }
}
