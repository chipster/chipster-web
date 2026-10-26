import { HttpParams } from "@angular/common/http";
import { Component, OnInit, ViewEncapsulation, inject, signal } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Role } from "chipster-js-common";
import { mergeMap } from "rxjs/operators";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { LoadState } from "../../../model/loadstate";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";
import { StatusComponent } from "../../../shared/components/status.component";

@Component({
  selector: "ch-statistics",
  templateUrl: "./statistics.component.html",
  styleUrls: ["./statistics.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
  imports: [FormsModule, ReactiveFormsModule, StatusComponent],
})
export class StatisticsComponent implements OnInit {
  private configService = inject(ConfigService);
  private errorHandlerService = inject(RestErrorService);
  private auhtHttpClient = inject(AuthHttpClientService);
  private tokenService = inject(TokenService);

  readonly IGNORE_USERS_PARAMS = "ignoreUsers";

  years = ["2017", "2018", "2019", "2020", "2021", "2022"];
  yearControl = new UntypedFormControl(this.years[4]);
  modules = ["all", "ngs", "microarray", "misc", "kielipankki"];
  moduleControl = new UntypedFormControl(this.modules[0]);

  ignoreUsersControl = new UntypedFormControl("");

  form = new UntypedFormGroup({
    year: this.yearControl,
    module: this.moduleControl,
    ignoreUsers: this.ignoreUsersControl,
  });

  readonly userCount = signal<number>(undefined);
  readonly jobCount = signal<number>(undefined);

  readonly state = signal(LoadState.Ready);

  ngOnInit(): void {
    this.configService.get(ConfigService.KEY_STATISTICS_IGNORE_USERS).subscribe({
      next: (usersString) => {
        if (usersString) {
          this.ignoreUsersControl.setValue(usersString);
        }
      },
      error: (err) => {
        this.errorHandlerService.showError("Failed to get ignoreUsers default", err);
      },
    });
  }

  public onSubmit(): void {
    this.updateStats();
  }

  updateStats(): void {
    this.state.set(LoadState.Loading);
    let params = new HttpParams().append("year", this.yearControl.value).append("module", this.moduleControl.value);

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
        mergeMap((service) =>
          this.auhtHttpClient.getAuthWithParams(service.adminUri + "/admin/jobhistory/statistics", params),
        ),
      )
      .subscribe({
        next: (result) => {
          this.userCount.set(result["userCount"]);
          this.jobCount.set(result["jobCount"]);
          this.state.set(LoadState.Ready);
        },
        error: (err) => {
          this.state.set(LoadState.Fail);
          this.errorHandlerService.showError("get statistics failed", err);
        },
      });
  }
}
