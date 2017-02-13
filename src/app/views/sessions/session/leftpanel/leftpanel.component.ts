
import SessionDataService from "../sessiondata.service";
import Dataset from "../../../../model/session/dataset";
import UtilsService from "../../../../shared/utilities/utils";
import SessionResource from "../../../../shared/resources/session.resource";
import SelectionService from "../selection.service";
import {SessionWorkerResource} from "../../../../shared/resources/sessionworker.resource";
import {SessionData} from "../../../../model/session/session-data";
import SessionEventService from "../sessionevent.service";
import {Component, Input} from "@angular/core";

@Component({
  selector: 'ch-leftpanel',
  templateUrl: './leftpanel.component.html'
})
export class LeftPanelComponent {

  @Input() sessionData: SessionData;
  private isCopying = false;
  datasetSearch: string;

  constructor(
    private sessionResource: SessionResource,
    private sessionDataService: SessionDataService,
    private sessionEventService: SessionEventService,
    private selectionService: SelectionService,
    private sessionWorkerResource: SessionWorkerResource) {}

  ngOnInit() {
    this.sessionEventService.getSessionStream().subscribe(() => {
      // someone else has updated the session notes or the session name, show it
      // this.$scope.$apply();
    });
  }

  datasetSearchKeyEvent(e: any) {
    if (e.keyCode == 13) { // enter
      // select highlighted datasets
      var allDatasets = this.getDatasetList();


      // TODO - fix: commented out on angular2 upgrade
      // this.selectionService.setSelectedDatasets(IChipsterFilter['searchDatasetFilter'](allDatasets, this.datasetSearch));

      this.datasetSearch = null;
    }
    if (e.keyCode == 27) { // escape key
      // clear the search
      this.datasetSearch = null;
    }
  }

  isSelectedDataset(dataset: Dataset) {
    return this.selectionService.isSelectedDataset(dataset);
  }

  getDatasetList(): Dataset[] {
    return UtilsService.mapValues(this.sessionData.datasetsMap);
  }

  downloadSession(): void {
    this.sessionWorkerResource.getPackageUrl(this.sessionDataService.getSessionId()).subscribe((url) => {
      this.sessionDataService.download(url);
    });
  }

  toggleDatasetSelection($event, data) {
    this.selectionService.toggleDatasetSelection($event, data, UtilsService.mapValues(this.sessionData.datasetsMap));
  }

  openCopySessionModal() {
    // var modalInstance = this.getSessionEditModal('Copy session', this.sessionData.session.name + '_copy');
    //
    //
    // modalInstance.result.then( (result: string) => {
    //   if (!result) {
    //     result = 'unnamed session';
    //   }
    //   this.isCopying = true;
    //   const sessionCopy$ = this.sessionResource.copySession(this.sessionData, result);
    //   sessionCopy$.subscribe(() => {
    //     this.isCopying = false;
    //   })
    // }, function () {
    //   modal dismissed
    // });
  }

}
