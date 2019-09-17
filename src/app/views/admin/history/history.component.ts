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
import { FilterParam } from "./FilterParam";
import { JobOutputModalComponent } from "./joboutputmodal.component";

@Component({
  selector: "ch-history",
  templateUrl: "./history.component.html",
  styleUrls: ["./history.component.less"],
  encapsulation: ViewEncapsulation.Emulated
})
export class HistoryComponent implements OnInit {
  jobHistoryListWithParam: Array<JobHistory> = [];
  jobFilterAttributeSet: Array<string> = [
    "userName",
    "toolName",
    "timeDuration",
    "jobStatus"
  ];
  selectedFilterAttribute: string;
  filteredSearchForm: FormGroup;
  selectAttributeForm: FormGroup;
  startTimeInputForm: FormGroup;
  endTimeInputForm: FormGroup;
  jobListLoading: Boolean = false;
  filterAttributeSet: Array<FilterParam> = [];
  page = 1;
  collectionSize = 70;
  jobNumber = 0;

  constructor(
    private configService: ConfigService,
    private errorHandlerService: RestErrorService,
    private auhtHttpClient: AuthHttpClientService,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private tokenService: TokenService
  ) {}

  ngOnInit() {
    this.filteredSearchForm = this.formBuilder.group({
      items: this.formBuilder.array([this.createItem()])
    });

    this.selectAttributeForm = this.formBuilder.group({
      selectedAttribute: ""
    });

    this.startTimeInputForm = this.formBuilder.group({
      startDateInput: "",
      startTimeInput: ""
    });

    this.endTimeInputForm = this.formBuilder.group({
      endDateInput: "",
      endTimeInput: ""
    });
    this.getTotalJobCount();
    this.selectedFilterAttribute = this.jobFilterAttributeSet[0];

    this.selectAttributeForm.valueChanges.subscribe(() => {
      // console.log(this.selectAttributeForm.value);
    });
  }

  public OnSubmit(formValue: any) {
    this.filterAttributeSet = [];
    this.page = 1;
    this.jobNumber = 0;
    this.getFormControlValues();
    this.getTotalJobCount();
  }

  getFormControlValues() {
    const arrayControl = this.filteredSearchForm.get("items") as FormArray;
    for (let i = 0; i < arrayControl.length; i++) {
      const filterParam = new FilterParam();
      if (this.checkIfValue(arrayControl.value[i].selectedAttribute)) {
        filterParam.name = arrayControl.value[i].selectedAttribute;
        if (arrayControl.value[i].value) {
          filterParam.value = arrayControl.value[i].value;
        }
        this.filterAttributeSet.push(filterParam);
      }
    }

    // Manipulating time input
    const startDateControl = this.startTimeInputForm.get("startDateInput");
    const startTimeControl = this.startTimeInputForm.get("startTimeInput");

    if (startDateControl.value && startTimeControl.value) {
      const filterParam = new FilterParam();
      filterParam.name = "startTime=gt";
      // console.log(typeof startTimeControl, typeof startTimeControl.value, startTimeControl.value);
      filterParam.value = new Date(
        startDateControl.value + "T" + startTimeControl.value
      ).toISOString();
      this.filterAttributeSet.push(filterParam);
    }
    const endDateControl = this.endTimeInputForm.get("endDateInput");
    const endTimeControl = this.endTimeInputForm.get("endTimeInput");

    if (endDateControl.value && endTimeControl.value) {
      const filterParam = new FilterParam();
      filterParam.name = "endTime=lt";
      filterParam.value = new Date(
        endDateControl.value + "T" + endTimeControl.value
      ).toISOString();
      this.filterAttributeSet.push(filterParam);
    }
  }

  getTotalJobCount() {
    this.jobListLoading = true;
    let params = new HttpParams();
    // first set the page number for which getting the record
    params = params.append("page", this.page.toString());
    for (let i = 0; i < this.filterAttributeSet.length; i++) {
      if (
        this.filterAttributeSet[i].name !== "" &&
        this.filterAttributeSet[i].name !== null &&
        this.filterAttributeSet[i].name !== undefined
      ) {
        params = params.append(
          this.filterAttributeSet[i].name,
          this.filterAttributeSet[i].value
        );
      }
    }
    this.configService
      .getInternalService(Role.JOB_HISTORY, this.tokenService.getToken())
      .pipe(
        flatMap(service => {
          return this.auhtHttpClient.getAuthWithParams(
            service.adminUri + "/admin/jobhistory/rowcount",
            params
          );
        })
      )
      .subscribe(
        recordNumber => {
          this.jobNumber = recordNumber;
          this.collectionSize = Math.ceil(recordNumber / 500) * 10;
          this.getJobByParam();
        },
        err => this.errorHandlerService.showError("get job numbers failed", err)
      );
  }

  getJobByParam() {
    let params = new HttpParams();
    // first set the page number for which getting the record
    params = params.append("page", this.page.toString());
    for (let i = 0; i < this.filterAttributeSet.length; i++) {
      if (
        this.filterAttributeSet[i].name !== null &&
        this.filterAttributeSet[i].name !== undefined &&
        this.filterAttributeSet[i].name !== ""
      ) {
        params = params.append(
          this.filterAttributeSet[i].name,
          this.filterAttributeSet[i].value
        );
      }
    }
    this.configService
      .getInternalService(Role.JOB_HISTORY, this.tokenService.getToken())
      .pipe(
        flatMap(service => {
          return this.auhtHttpClient.getAuthWithParams(
            service.adminUri + "/admin/jobhistory",
            params
          );
        })
      )
      .subscribe(
        (jobHistoryList: JobHistory[]) => {
          this.jobListLoading = false;
          this.jobHistoryListWithParam = [];
          this.jobHistoryListWithParam = jobHistoryList;
          this.filterAttributeSet = [];
          if (this.jobHistoryListWithParam.length < 1) {
            alert("No results found");
          }
        },
        err => this.errorHandlerService.showError("get clients failed", err)
      );
  }

  reload() {
    this.resetForm();
    this.filterAttributeSet = [];
    this.page = 1;
    this.jobNumber = 0;
    this.getTotalJobCount();
  }

  openJobOutputModal(jobhistory: JobHistory) {
    const modalRef = this.modalService.open(JobOutputModalComponent, {
      size: "lg"
    });
    modalRef.componentInstance.output = jobhistory.output;
  }

  onPageChange(page) {
    this.page = page;
    this.getFormControlValues();
    this.getJobByParam();
  }

  resetForm() {
    this.filteredSearchForm.reset({
      selectedAttribute: "",
      value: ""
    });
    this.startTimeInputForm.reset();
    this.endTimeInputForm.reset();
  }

  createItem(): FormGroup {
    return this.formBuilder.group({
      selectedAttribute: "",
      value: ""
    });
  }

  get items(): FormArray {
    return this.filteredSearchForm.get("items") as FormArray;
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  checkIfValue(x: any): boolean {
    console.log(x);
    if (x || x !== undefined || x != null || x !== "") {
      return true;
    } else {
      return false;
    }
  }
}
