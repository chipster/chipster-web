import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {ConfigService} from "../../../shared/services/config.service";
import {RestErrorService} from "../../../core/errorhandler/rest-error.service";
import {AuthHttpClientService} from "../../../shared/services/auth-http-client.service";
import {Observable} from "rxjs/Observable";
import { Job } from "chipster-js-common";
import {IdPair} from "../../../model/id-pair";

@Component({
  selector: 'ch-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.less'],
  encapsulation: ViewEncapsulation.Emulated
})
export class JobsComponent implements OnInit {

  jobs: Job[];

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private authHttpClient: AuthHttpClientService,
  ) { }

  ngOnInit() {

    this.jobs = [];

    let sessionDbUrl;

    this.configService.getSessionDbUrl()
      .do(url => sessionDbUrl = url)
      .flatMap(url => {
        let newJobs$: Observable<IdPair[]> = <any>this.authHttpClient.getAuth(url + '/jobs?state=NEW');
        let runningJobs$: Observable<IdPair[]> = <any>this.authHttpClient.getAuth(url + '/jobs?state=RUNNING');
        return Observable.forkJoin(newJobs$, runningJobs$);
      })
      .flatMap(newAndRunningJobs => {
        let newJobs = newAndRunningJobs[0];
        let runningJobs = newAndRunningJobs[1];
        let jobIds = newJobs.concat(runningJobs);
        let jobs$: Observable<Job>[] = jobIds.map(idPair => <any>this.authHttpClient.getAuth(
          sessionDbUrl + '/sessions/' + idPair.sessionId + '/jobs/' + idPair.jobId));
        return Observable.forkJoin(jobs$);
      })
      .subscribe(jobs => {
        this.jobs = jobs;
      }, err => this.restErrorService.handleError(err, 'get jobs failed'));
  }
}
