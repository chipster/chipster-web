import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Job } from 'chipster-js-common';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { SelectionService } from '../../selection.service';
import UtilsService from '../../../../../shared/utilities/utils';

@Component({
  selector: 'ch-job-list',
  templateUrl: './job-list.component.html'
})
export class JobListComponent implements OnChanges {

  @Input() jobs: Job[];
  jobsSorted: Job[];

  @Output() private jobSelected = new EventEmitter<Job>();

  constructor(
    private dropDown: NgbDropdown,
    private selectionService: SelectionService) {
  }

  ngOnChanges() {
    this.jobsSorted = this.jobs.sort((a, b) => {
      const d1 = new Date(a.created).getTime();
      const d2 = new Date(b.created).getTime();
      return d2 - d1;
    });
  }

  selectJob(job: Job) {
    this.jobSelected.emit(job);
    this.dropDown.close();
  }

  closeDropDown() {
    this.dropDown.close();
  }

  calculateDuration(startTime, endTime) {
    let duration = "";
    if (startTime != null && endTime != null) {
      let computingTime = UtilsService.parseISOStringToDate(endTime).getTime() - UtilsService.parseISOStringToDate(startTime).getTime();
      if (computingTime > 1000) {
        duration = UtilsService.convertMS(computingTime);
      } else duration = computingTime.toString() + "ms";

      return duration;
    }
  }

}
