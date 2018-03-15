import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ConfigService} from "../../../shared/services/config.service";
import {Service} from "../../../model/service";
import {Observable} from "rxjs";
import {RestService} from "../../../core/rest-services/restservice/rest.service";
import {JobHistory} from "../../../model/jobhistory";
import {RestErrorService} from "../../../core/errorhandler/rest-error.service";
import {AuthHttpClientService} from "../../../shared/services/auth-http-client.service";

@Component({
  selector: 'ch-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.less'],
  encapsulation: ViewEncapsulation.Emulated
})
export class HistoryComponent implements OnInit {
  private jobHistoryList: Array<JobHistory>;

  constructor(private configService: ConfigService,
              private errorHandlerService: RestErrorService,
              private auhtHttpClient: AuthHttpClientService,) {
  }

  ngOnInit() {
    this.configService.getService('job-history')
      .flatMap(service => {
        console.log(service.publicUri);
        return this.auhtHttpClient.getAuth(service.publicUri + '/jobhistory');
      })
      .subscribe((jobHistoryList: JobHistory[]) => {
        console.log(jobHistoryList);
        this.jobHistoryList = jobHistoryList;


      }, err => this.errorHandlerService.handleError(err, 'get clients failed'));
  }


}
