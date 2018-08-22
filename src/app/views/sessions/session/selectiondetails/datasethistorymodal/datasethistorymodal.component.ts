import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Dataset from "chipster-js-common";
import {SessionData} from "../../../../../model/session/session-data";
import Job from "chipster-js-common";
import JobParameter from "chipster-js-common";


@Component({
  selector: 'ch-datasethistorymodal',
  templateUrl: './datasethistorymodal.component.html',
  styleUrls: ['./datasethistorymodal.component.less']
})
export class DatasetHistorymodalComponent implements OnInit {

  @Input('dataset') dataset: Dataset;
  @Input('sessionData') sessionData: SessionData;


  // manipulating the checkboxes for history options
  historyFilterOptions = ['StepTitle', 'DatasetName', 'CreationDate', 'AppliedTool', 'Parameter', 'SourceCode'];
  historyOptionMap = {StepTitle: false, DatasetName: false, CreationDate: false,
    AppliedTool: false, Parameter: false, SourceCode: false};
  historyOptionChecked = [];

  stepCount: number;
  datasetHistorySteps: Array<DatasetHistoryStep> = [];


  constructor(public activeModal: NgbActiveModal) {

  }

  ngOnInit(): void {
    this.stepCount = 0;
    this.getHistoryData();
    this.initHistoryOptionMap();

  }

  initHistoryOptionMap() {
    for (let x = 0; x < this.historyFilterOptions.length; x++) {
      this.historyOptionMap[this.historyFilterOptions[x]] = true;
    }
  }

  updateCheckedOptions(option, event) {
    this.historyOptionMap[option] = event.target.checked;
  }

  getCheckedOptionStatus(index: number) {
    return this.historyOptionMap[this.historyFilterOptions[index]];
  }

  getHistoryData() {
    let sourceJobId: string = this.dataset.sourceJob;
    let datasetId: string = this.dataset.datasetId;
    let curSourceJob: Job;


    // if this is not the first input dataset, otherwise sourceJob is null or
    // there will be no input file, so we need to check both

    while (this.sessionData.datasetsMap.has(datasetId) && this.sessionData.jobsMap.has(sourceJobId) &&
    (this.sessionData.jobsMap.get(sourceJobId)).inputs.length > 0) {

      const curStepDetail: DatasetHistoryStep = new DatasetHistoryStep();
      // Populate history data
        curSourceJob = this.sessionData.jobsMap.get(sourceJobId);
        curStepDetail.datasetName = this.sessionData.datasetsMap.get(datasetId).name;
        curStepDetail.creationDate = this.sessionData.session.created;
        curStepDetail.sourceJobName = curSourceJob.toolName;
        curStepDetail.parameterList = curSourceJob.parameters;
        curStepDetail.inputFileName = curSourceJob.inputs[0].displayName;
        curStepDetail.sourceCode = curSourceJob.sourceCode;
      this.datasetHistorySteps[this.stepCount] = curStepDetail;
      this.stepCount++;

      datasetId = (this.sessionData.jobsMap.get(sourceJobId)).inputs[0].datasetId;
      sourceJobId = (this.sessionData.datasetsMap.get(datasetId)).sourceJob;

    }

    // Reverse the order of steps so that it shows analysis history from root to leaf
    this.datasetHistorySteps.reverse();

  }
}


export class DatasetHistoryStep {
  datasetName: string;
  creationDate: string;
  sourceJobName: string;
  parameterList: JobParameter[];
  inputFileName: string;
  sourceCode: string;


}


