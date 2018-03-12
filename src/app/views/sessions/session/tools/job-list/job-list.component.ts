import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import Job from '../../../../../model/session/job';
import {NgbDropdown} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ch-job-list',
  templateUrl: './job-list.component.html'
})
export class JobListComponent implements OnChanges {

  @Input() jobs: Job[];
  jobsSorted: Job[];

  @Output() private selectJobEmitter = new EventEmitter<Job>();

  constructor(private dropDown: NgbDropdown) {
  }

  ngOnChanges() {
    this.jobsSorted = this.jobs.sort((a, b) => {
      const d1 = new Date(a.created).getTime();
      const d2 = new Date(b.created).getTime();
      return d2 - d1;
    });
  }

  selectJob(job: Job) {
    this.selectJobEmitter.emit(job);
    this.dropDown.close();
  }
}
