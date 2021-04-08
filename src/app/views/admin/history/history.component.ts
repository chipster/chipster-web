import { HttpParams } from "@angular/common/http";
import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { FormArray, FormBuilder, FormGroup } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { JobHistory, Role } from "chipster-js-common";
import { flatMap } from "rxjs/operators";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";
import UtilsService from "../../../shared/utilities/utils";
import { JobOutputModalComponent } from "./joboutputmodal.component";

@Component({
  selector: "ch-history",
  templateUrl: "./history.component.html",
  styleUrls: ["./history.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class HistoryComponent implements OnInit {
  readonly comparisonIs = "is";
  readonly comparisonIsNot = "is not";
  readonly attributeUserName = "createdBy";

  jobs: Array<JobHistory> = [];
  jobFilterAttributeSet: Array<string> = [
    this.attributeUserName,
    "toolId",
    "state",
    "comp",
    "module",
  ];
  jobFilterComparisonSet: Array<string> = [
    this.comparisonIs,
    this.comparisonIsNot,
  ];

  stringFiltersForm: FormGroup;
  startDateTimeFilterForm: FormGroup;
  endDateTimeFilterForm: FormGroup;
  stringFiltersFormArray: FormArray;

  jobListLoading = false;
  page = 1;
  collectionSize = 70;
  jobNumber = 0;
  updateTime = null;

  constructor(
    private configService: ConfigService,
    private errorHandlerService: RestErrorService,
    private auhtHttpClient: AuthHttpClientService,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private tokenService: TokenService
  ) {}

  ngOnInit() {
    this.stringFiltersFormArray = this.formBuilder.array([]);

    this.stringFiltersForm = this.formBuilder.group({
      items: this.stringFiltersFormArray,
    });

    this.startDateTimeFilterForm = this.formBuilder.group(
      this.getEmptyTimeFilter()
    );
    this.endDateTimeFilterForm = this.formBuilder.group(
      this.getEmptyTimeFilter()
    );

    this.resetForm();

    this.updateJobCountAndJobs();
  }

  public onSubmit() {
    this.page = 1;
    this.jobNumber = 0;
    this.updateJobCountAndJobs();
  }

  getFilterParams() {
    let params = new HttpParams();

    for (let i = 0; i < this.stringFiltersFormArray.length; i++) {
      let filter = this.stringFiltersFormArray.value[i];
      params = this.appendStringParam(
        params,
        filter.selectedAttribute,
        filter.value,
        filter.selectedComparison
      );
    }

    const startDateControl = this.startDateTimeFilterForm.get("dateInput");
    const startTimeControl = this.startDateTimeFilterForm.get("timeInput");

    const startDate = this.ngbDateStructToString(startDateControl.value);

    params = this.appendDateTimeParam(
      params,
      startDate,
      startTimeControl.value,
      ">"
    );

    const endDateControl = this.endDateTimeFilterForm.get("dateInput");
    const endTimeControl = this.endDateTimeFilterForm.get("timeInput");

    const endDate = this.ngbDateStructToString(endDateControl.value);

    params = this.appendDateTimeParam(
      params,
      endDate,
      endTimeControl.value,
      "<"
    );

    return params;
  }

  ngbDateStructToString(ngbDate) {
    if (ngbDate) {
      // can't set directly in the constructor new Date(year, month, day), because that would
      // in local time. We don't set the time, which would be 00:00 and the time zone here is -2.
      // This would result to the previous day.
      let date = new Date();
      date.setUTCFullYear(ngbDate.year);
      date.setUTCMonth(ngbDate.month - 1);
      date.setUTCDate(ngbDate.day);
      let isoDate = date.toISOString().slice(0, 10);

      return isoDate;
    }
    return null;
  }

  appendStringParam(params, attribute, value, comparison) {
    if (
      attribute != null &&
      attribute.length > 0 &&
      value != null &&
      value.length > 0
    ) {
      if (comparison === this.comparisonIsNot) {
        value = "!" + value;
      }

      params = params.append(attribute, value);
    }
    return params;
  }

  appendDateTimeParam(params, date, time, comparison) {
    if (date && time) {
      let name = "created";
      // can't use new Date(date + "T" + time), because that would assume it to be local time)
      let value = date + "T" + time + ":00.000Z";

      params = params.append(name, comparison + value);
    }
    return params;
  }

  updateJobCountAndJobs() {
    this.jobListLoading = true;
    let filterParams = this.getFilterParams();

    this.configService
      .getInternalService(Role.JOB_HISTORY, this.tokenService.getToken())
      .pipe(
        flatMap((service) => {
          return this.auhtHttpClient.getAuthWithParams(
            service.adminUri + "/admin/jobhistory/rowcount",
            filterParams
          );
        })
      )
      .subscribe(
        (recordNumber) => {
          this.jobNumber = recordNumber;
          this.collectionSize = Math.ceil(recordNumber / 500) * 10;
          this.updateJobs(filterParams);
        },
        (err) =>
          this.errorHandlerService.showError("get job numbers failed", err)
      );
  }

  updateJobs(filterParams) {
    // set the page number for which getting the record
    filterParams = filterParams.append("page", this.page.toString());

    this.configService
      .getInternalService(Role.JOB_HISTORY, this.tokenService.getToken())
      .pipe(
        flatMap((service) => {
          return this.auhtHttpClient.getAuthWithParams(
            service.adminUri + "/admin/jobhistory",
            filterParams
          );
        })
      )
      .subscribe(
        (jobHistoryList: JobHistory[]) => {
          this.jobListLoading = false;
          this.jobs = jobHistoryList;
          this.updateTime = new Date();
        },
        (err) => this.errorHandlerService.showError("failed to get jobs", err)
      );
  }

  reset() {
    this.resetForm();
    this.page = 1;
    this.jobNumber = 0;
    this.updateJobCountAndJobs();
  }

  getDuration(jobHistory: JobHistory) {
    if (jobHistory && jobHistory.startTime) {
      let startDate = UtilsService.parseISOStringToDate(jobHistory.startTime);

      let endDate = null;
      if (jobHistory.endTime) {
        endDate = UtilsService.parseISOStringToDate(jobHistory.endTime);
      } else {
        /* Show a fixed age of running jobs

        It would be easy to update the age constantly like we do for the end user, but
        that would give a false sense of live updates, which we don't have here.
        */
        endDate = this.updateTime;
      }

      let millis = UtilsService.millisecondsBetweenDates(startDate, endDate);
      return UtilsService.millisecondsToHumanFriendly(millis);
    }
    return null;
  }

  openJobOutputModal(jobhistory: JobHistory) {
    const modalRef = this.modalService.open(JobOutputModalComponent, {
      size: "xl",
    });
    modalRef.componentInstance.output = jobhistory.screenOutput;
  }

  onPageChange(page) {
    this.page = page;
    this.updateJobs(this.getFilterParams());
  }

  resetForm() {
    for (let i = this.stringFiltersFormArray.length - 1; i >= 0; i--) {
      this.stringFiltersFormArray.removeAt(i);
    }

    this.stringFiltersFormArray.push(
      this.formBuilder.group(this.getDefaultStringFilter())
    );
    this.stringFiltersFormArray.push(
      this.formBuilder.group(this.getEmptyStringFilter())
    );

    this.startDateTimeFilterForm.reset(this.getEmptyTimeFilter());
    this.endDateTimeFilterForm.reset(this.getEmptyTimeFilter());
  }

  deleteFilter(index) {
    this.stringFiltersFormArray.removeAt(index);
    this.updateJobCountAndJobs();
  }

  getDefaultStringFilter() {
    return {
      selectedAttribute: this.attributeUserName,
      selectedComparison: this.comparisonIsNot,
      value: "jaas/replay_test",
    };
  }

  getEmptyStringFilter() {
    return {
      selectedAttribute: "",
      selectedComparison: this.comparisonIs,
      value: "",
    };
  }

  getEmptyTimeFilter() {
    return {
      dateInput: "",
      timeInput: "00:00",
    };
  }

  addItem(): void {
    this.stringFiltersFormArray.push(
      this.formBuilder.group(this.getEmptyStringFilter())
    );
  }

  toShortDateTime(isoDateString) {
    if (isoDateString) {
      let date = isoDateString.slice(0, 10);
      let time = isoDateString.slice(11, 16);
      return date + " " + time;
    }
    return null;
  }
}
