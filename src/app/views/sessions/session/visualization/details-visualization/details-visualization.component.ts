import { FileResource } from "../../../../../shared/resources/fileresource";
import { SessionDataService } from "../../sessiondata.service";
import Dataset from "chipster-js-common";
import { Component, Input, OnChanges, OnDestroy } from "@angular/core";
import { Response } from "@angular/http";
import { VisualizationModalService } from "../visualizationmodal.service";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { Subject } from "rxjs/Subject";
import { LoadState, State } from "../../../../../model/loadstate";
import { SessionData } from "../../../../../model/session/session-data";

@Component({
  selector: "ch-details-visualization",
  templateUrl: "./details-visualization.component.html"
})
export class DetailsVisualizationComponent {
  @Input() dataset: Dataset;
  @Input() sessionData: SessionData;

  constructor() {}
}
