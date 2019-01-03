import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Component, Input} from '@angular/core';
import { Job } from 'chipster-js-common';
import { ContactSupportService } from '../../../contact/contact-support.service';

@Component({
  templateUrl: './joberrormodal.component.html'
})
export class JobErrorModalComponent {

  @Input() title: string;
  @Input() job: Job;

  constructor(
    private activeModal: NgbActiveModal,
    private contactSupportService: ContactSupportService,
  ) { }

  close() {
    this.activeModal.close();
  }

  cancel() {
    this.activeModal.dismiss();
  }

  contactSupport() {
    this.activeModal.close();
    this.contactSupportService.openContactSupportModal(this.jobToLog(this.job));
  }

  jobToLog(job: Job) {
    let log = "";
    log += "Job error\n";
    log += "Tool:         " + job.module + " / " + job.toolCategory + " / " + job.toolId + "\n";
    log += "State:        " + job.state + " (" + job.stateDetail + ")\n";
    log += "Created:      " + job.created + "\n";
    log += "Started:      " + job.startTime + "\n";
    log += "Finished:     " + job.endTime + "\n";
    log += "JobId:        " + job.jobId + "\n";
    log += "\n";

    log += "Parameters: \n";
    for (const param of job.parameters) {
      log += "- " + param.parameterId + ": " + param.value;
    }
    log += "\n";

    log += "Inputs: \n";
    for (const input of job.inputs) {
      log += "- " + input.inputId + ": " + input.displayName + " (" + input.datasetId + ")";
    }
    log += "\n";

    log += "Screen output: \n";
    log += job.screenOutput + "\n";
    return log;
  }
}
