import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ConfigService} from "../../../shared/services/config.service";
import {Service} from "../../../model/service";
import {Observable} from "rxjs";
import {RestService} from "../../../core/rest-services/restservice/rest.service";
import {JobHistory} from "../../../model/jobhistory";
import {RestErrorService} from "../../../core/errorhandler/rest-error.service";
import {AuthHttpClientService} from "../../../shared/services/auth-http-client.service";
import {Role} from "../../../model/role";
import {TokenService} from "../../../core/authentication/token.service";

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
              private auhtHttpClient: AuthHttpClientService,
              private tokenService:TokenService) {
  }

  ngOnInit() {
    this.configService.getPublicUri(Role.JOB_HISTORY)
      .flatMap(url => {
        console.log(url);
        return this.auhtHttpClient.getAuth(url + '/jobhistory');
      })
      .subscribe((jobHistoryList: JobHistory[]) => {
        console.log(jobHistoryList);
        this.jobHistoryList = jobHistoryList;


      }, err => this.errorHandlerService.handleError(err, 'get clients failed'));
  }


}
