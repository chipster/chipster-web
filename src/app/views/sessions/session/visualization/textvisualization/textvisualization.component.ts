import {FileResource} from "../../../../../shared/resources/fileresource";
import {SessionDataService} from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import {Component, Input, OnChanges, OnDestroy} from "@angular/core";
import {Response} from "@angular/http";
import {VisualizationModalService} from "../visualizationmodal.service";
import {RestErrorService} from "../../../../../core/errorhandler/rest-error.service";
import {Subject} from "rxjs/Subject";

@Component({
  selector: 'ch-text-visualization',
  templateUrl: './textvisualization.component.html',
  styles: [`
    pre {
      background-color: white;
    }
  `],
})
export class TextVisualizationComponent implements OnChanges, OnDestroy {

  @Input() dataset: Dataset;
  @Input() showFullData: boolean;

  private data: string;
  private status: string;

  private unsubscribe: Subject<any> = new Subject();


  fileSizeLimit = 10 * 1024;

  constructor(private fileResource: FileResource,
              private sessionDataService: SessionDataService,
              private visualizationModalService: VisualizationModalService,
              private errorHandlerService: RestErrorService) {
  }

  ngOnChanges() {
    // unsubscribe from possible previous subscriptions
    this.unsubscribe.next();

    this.data = null;
    this.status = "Loading data";
    let maxBytes = this.showFullData ? null : this.fileSizeLimit;

    this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset, maxBytes)
      .takeUntil(this.unsubscribe)
      .subscribe((response: any) => {
        this.data = response;
      }, (error: Response) => {
        this.status = "Loading data failed";
        this.errorHandlerService.handleError(error, "Loading data failed");
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  getSizeShown() {
    if (this.data) {
      return this.data.length;
    }
  }

  getSizeFull() {
    return this.dataset.size;
  }

  isCompleteFile() {
    return this.getSizeShown() === this.getSizeFull();
  }

  showAll() {
    this.visualizationModalService.openVisualizationModal(this.dataset, 'text');
  }

}
