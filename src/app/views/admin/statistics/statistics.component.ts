import { HttpParams } from "@angular/common/http";
import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Role } from "chipster-js-common";
import { flatMap } from "rxjs/operators";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { LoadState } from "../../../model/loadstate";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";

@Component({
  selector: "ch-statistics",
  templateUrl: "./statistics.component.html",
  styleUrls: ["./statistics.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class StatisticsComponent implements OnInit {
  readonly IGNORE_USERS_PARAMS = "ignoreUsers";

  years = ["2020", "2021", "2022"];
  yearControl = new FormControl(this.years[1]);
  ignoreUsersControl = new FormControl("");

  form = new FormGroup({
    year: this.yearControl,
    ignoreUsers: this.ignoreUsersControl,
  });

  userCount: number;
  jobCount: number;

  state = LoadState.Ready;

  constructor(
    private configService: ConfigService,
    private errorHandlerService: RestErrorService,
    private auhtHttpClient: AuthHttpClientService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.configService.get(ConfigService.KEY_STATISTICS_IGNORE_USERS).subscribe(
      (usersString) => {
        if (usersString) {
          this.ignoreUsersControl.setValue(usersString);
        }
      },
      (err) => {
        this.errorHandlerService.showError("Failed to get ignoreUsers default", err);
      }
    );
  }

  public onSubmit(): void {
    this.updateStats();
  }

  updateStats(): void {
    this.state = LoadState.Loading;
    let params = new HttpParams().append("year", this.yearControl.value);

    this.ignoreUsersControl.value
      .split(",")
      .map((user) => user.trim())
      .filter((user) => user.length > 0)
      .forEach((user) => {
        params = params.append(this.IGNORE_USERS_PARAMS, user);
      });

    this.configService
      .getInternalService(Role.JOB_HISTORY, this.tokenService.getToken())
      .pipe(
        flatMap((service) => {
          return this.auhtHttpClient.getAuthWithParams(service.adminUri + "/admin/jobhistory/statistics", params);
        })
      )
      .subscribe(
        (result) => {
          this.userCount = result["userCount"];
          this.jobCount = result["jobCount"];
          this.state = LoadState.Ready;
        },
        (err) => {
          this.state = LoadState.Fail;
          this.errorHandlerService.showError("get statistics failed", err);
        }
      );
  }
}
