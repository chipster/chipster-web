import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ConfigService} from "../../../shared/services/config.service";
import {JobHistory} from "../../../model/jobhistory";
import {RestErrorService} from "../../../core/errorhandler/rest-error.service";
import {AuthHttpClientService} from "../../../shared/services/auth-http-client.service";
import {Role} from "../../../model/role";
import {FormGroup, FormBuilder, FormControl, FormArray} from "@angular/forms";
import {HttpParams} from "@angular/common/http";
import {FilterParam} from "./FilterParam";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {JobOutputModalComponent} from "./joboutputmodal.component";
import {TokenService} from "../../../core/authentication/token.service";



@Component({
  selector: 'ch-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.less'],
  encapsulation: ViewEncapsulation.Emulated
})

export class HistoryComponent implements OnInit {
  jobHistoryList: Array<JobHistory>;
  jobHistoryListWithParam: Array<JobHistory>;
  currentJobHistoryList: Array<JobHistory>;
  jobFilterAttributeSet: Array<string> = ["userName", "toolName","timeDuration", "jobStatus"];
  selectedFilterAttribute: string;
  filteredSearchForm: FormGroup;
  selectAttributeForm: FormGroup;
  startTimeInputForm: FormGroup;
  endTimeInputForm: FormGroup;
  haveFilterAttribute: Boolean = false;


  filterAttributeSet: Array<FilterParam> = [];


  constructor(private configService: ConfigService,
              private errorHandlerService: RestErrorService,
              private auhtHttpClient: AuthHttpClientService,
              private formBuilder: FormBuilder,
              private modalService: NgbModal,
              private tokenService: TokenService) {
  }

  ngOnInit() {
    this.filteredSearchForm = this.formBuilder.group({
      items: this.formBuilder.array([this.createItem()])
    });

    this.selectAttributeForm = this.formBuilder.group({
      selectedAttribute: ''
    });

    this.startTimeInputForm = this.formBuilder.group({
      startTimeInput: ''
    });

    this.endTimeInputForm = this.formBuilder.group({
      endTimeInput: ''
    });

    this.currentJobHistoryList = [];
    this.getAllJob();
    this.selectedFilterAttribute = this.jobFilterAttributeSet[0];

    this.selectAttributeForm.valueChanges.subscribe(() => {
      console.log(this.selectAttributeForm.value);
    });
  }


  createItem(): FormGroup {
    return this.formBuilder.group({
      selectedAttribute: '',
      value: ''
    });
  }

  get items(): FormArray {
    return this.filteredSearchForm.get('items') as FormArray;
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  public OnSubmit(formValue: any) {
    this.filterAttributeSet = [];
    const arrayControl = this.filteredSearchForm.get('items') as FormArray;
    console.log(arrayControl.length);

    for (let i = 0; i < arrayControl.length; i++) {
      const filterParam = new FilterParam();
      if(arrayControl.value[i].selectedAttribute!=""){
        filterParam.name = arrayControl.value[i].selectedAttribute;
        if (arrayControl.value[i].value) {
          this.haveFilterAttribute = true;
          filterParam.value = arrayControl.value[i].value;
        }
        this.filterAttributeSet.push(filterParam);
      }

    }

    console.log(this.filterAttributeSet);

    // Manipulating time inputs
    const startTimeControl = this.startTimeInputForm.get('startTimeInput');
    if (startTimeControl.value) {
      this. haveFilterAttribute = true;
      const filterParam = new FilterParam();
      filterParam.name = "startTime=gt";
      // console.log(typeof startTimeControl, typeof startTimeControl.value, startTimeControl.value);
      filterParam.value = new Date(startTimeControl.value).toISOString();
      this.filterAttributeSet.push(filterParam);
    }

    const endTimeControl = this.endTimeInputForm.get('endTimeInput');
    if (endTimeControl.value) {
      this. haveFilterAttribute = true;
      const filterParam = new FilterParam();
      filterParam.name = "endTime=lt";
      filterParam.value = new Date(endTimeControl.value).toISOString();
      this.filterAttributeSet.push(filterParam);
    }
    this.getJobByParam();
    // console.log(this.filterAttributeSet);

  }

  resetForm() {
    this.filteredSearchForm.reset({
      selectedAttribute: '',
      value: ''
    });
    this.startTimeInputForm.reset();
    this.endTimeInputForm.reset();
  }

  getAllJob() {
    this.configService.getInternalService(Role.JOB_HISTORY, this.tokenService.getToken())
      .flatMap(service => {
        return this.auhtHttpClient.getAuth(service.adminUri + '/admin/jobhistory');
      })
      .subscribe((jobHistoryList: JobHistory[]) => {
        this.jobHistoryList = jobHistoryList;
        console.log(jobHistoryList);
        this.currentJobHistoryList = [];
        this.currentJobHistoryList = this.jobHistoryList;

      }, err => this.errorHandlerService.handleError(err, 'get clients failed'));
  }


  getJobByParam() {
    let params = new HttpParams();
    for (let i = 0; i < this.filterAttributeSet.length; i++) {
      params = params.append(this.filterAttributeSet[i].name, this.filterAttributeSet[i].value);
    }
    this.configService.getInternalService(Role.JOB_HISTORY, this.tokenService.getToken())
      .flatMap(service => {
        return this.auhtHttpClient.getAuthWithParams(service.adminUri + '/admin/jobhistory', params);
      })
      .subscribe((jobHistoryList: JobHistory[]) => {
        this.jobHistoryListWithParam = jobHistoryList;
        this.currentJobHistoryList = [];
        this.currentJobHistoryList = this.jobHistoryListWithParam;

        // console.log(this.jobHistoryList);
      }, err => this.errorHandlerService.handleError(err, 'get clients failed'));
  }

  changeValue() {
    console.log("some value changed");
    console.log(this.selectAttributeForm.value);
  }

  reload() {
    this.resetForm();
    this.haveFilterAttribute = false;
    this.filterAttributeSet = [];
    this.getAllJob();
  }

  openJobOutputModal() {
    const modalRef = this.modalService.open(JobOutputModalComponent);
    modalRef.componentInstance.output = "JobOutput";
  }




}
