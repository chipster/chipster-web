import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ConfigService} from "../../../shared/services/config.service";
import {JobHistory} from "../../../model/jobhistory";
import {RestErrorService} from "../../../core/errorhandler/rest-error.service";
import {AuthHttpClientService} from "../../../shared/services/auth-http-client.service";
import {Role} from "../../../model/role";
import {FormGroup, FormBuilder, FormControl, FormArray} from "@angular/forms";
import {HttpParams} from "@angular/common/http";
import {FilterParam} from "./FilterParam";


@Component({
  selector: 'ch-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.less'],
  encapsulation: ViewEncapsulation.Emulated
})

export class HistoryComponent implements OnInit {
  jobHistoryList: Array<JobHistory>;
  jobFilterAttributeSet: Array<string> = ["userName", "toolName", "compName", "startTime", "endTime", "timeDuration", "jobStatus"];
  selectedFilterAttribute: string;
  filteredSearchForm: FormGroup;
  selectAttributeForm: FormGroup;
  filterAttributeSet: Array<FilterParam> = [];


  constructor(private configService: ConfigService,
              private errorHandlerService: RestErrorService,
              private auhtHttpClient: AuthHttpClientService,
              private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.filteredSearchForm = this.formBuilder.group({
      items: this.formBuilder.array([this.createItem()])
    });

    this.selectAttributeForm = this.formBuilder.group({
      selectedAttribute: ''
    });

    //this.getJobByUserName("admin");
    this.getAllJob();
    this.selectedFilterAttribute = this.jobFilterAttributeSet[0];

    this.selectAttributeForm.valueChanges.subscribe(() => {
      console.log(this.selectAttributeForm.value);
    })
  }


  createItem(): FormGroup {
    return this.formBuilder.group({
      selectedAttribute: '',
      value: ''
    });
  }

  get items(): FormArray {
    return this.filteredSearchForm.get('items') as FormArray;
  };

  addItem(): void {
    this.items.push(this.createItem());
  }

  public OnSubmit(formValue: any) {
    this.filterAttributeSet = [];
    var arrayControl = this.filteredSearchForm.get('items') as FormArray;
    for (var i = 0; i < arrayControl.length; i++) {
      var filterParam = new FilterParam();
      if (arrayControl.value[i].selectedAttribute === "startTime" || arrayControl.value[i].selectedAttribute === "endTime") {
        console.log(arrayControl.value[i].value);
        var event = new Date(arrayControl.value[i].value);
        console.log(event);
        console.log(event.toISOString());
      }
      filterParam.name = arrayControl.value[i].selectedAttribute;
      filterParam.value = arrayControl.value[i].value;
      this.filterAttributeSet.push(filterParam);
    }
    this.getJobByParam();
    console.log(this.filterAttributeSet);

  }

  getAllJob() {
    this.configService.getPublicUri(Role.JOB_HISTORY)
      .flatMap(url => {
        return this.auhtHttpClient.getAuth(url + '/jobhistory');
      })
      .subscribe((jobHistoryList: JobHistory[]) => {
        this.jobHistoryList = jobHistoryList;
        console.log(jobHistoryList);

      }, err => this.errorHandlerService.handleError(err, 'get clients failed'));
  }


  getJobByParam() {
    let params = new HttpParams();
    for (var i = 0; i < this.filterAttributeSet.length; i++) {
      params = params.append(this.filterAttributeSet[i].name, this.filterAttributeSet[i].value);
    }
    this.configService.getPublicUri(Role.JOB_HISTORY)
      .flatMap(url => {
        return this.auhtHttpClient.getAuthWithParams(url + '/jobhistory', params);
      })
      .subscribe((jobHistoryList: JobHistory[]) => {
        this.jobHistoryList = jobHistoryList;
        console.log(this.jobHistoryList);


      }, err => this.errorHandlerService.handleError(err, 'get clients failed'));
  }

  changeValue() {
    console.log(this.selectAttributeForm.value);

  }


}
