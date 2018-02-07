import {Component, Input, OnChanges} from "@angular/core";
import Job from "../../../../../model/session/job";


@Component({
  selector: 'ch-job-list',
  templateUrl: './job-list.component.html'
})
export class JobListComponent implements OnChanges {

  @Input() jobs: Job[];
  jobsSorted: Job[];

  constructor() {}

  ngOnChanges() {
    this.jobsSorted = this.jobs.sort((a, b) => {
      let d1 = new Date(a.startTime).getTime();
      let d2 = new Date(b.startTime).getTime();
      return d2 - d1;
    });
  }

  openJobDetails(job: Job) {
    console.log("TODO open job details");
  }

}
