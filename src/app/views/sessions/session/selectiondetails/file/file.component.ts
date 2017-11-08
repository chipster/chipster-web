import {Component, EventEmitter, Input, Output} from "@angular/core";
import {SessionDataService} from "../../sessiondata.service";
import {SelectionService} from "../../selection.service";
import Dataset from "../../../../../model/session/dataset";
import Job from "../../../../../model/session/job";
import {SessionData} from "../../../../../model/session/session-data";

@Component({
  selector: 'ch-file',
  templateUrl: './file.component.html'
})
export class FileComponent {

  @Input() private dataset: Dataset;
  @Input() private jobs: Map<string, Job>;
  @Input() private sessionData: SessionData;
  @Output() onDelete: EventEmitter<any> = new EventEmitter();

  constructor(
    private selectionService: SelectionService,
    private sessionDataService: SessionDataService) {
  }
}
