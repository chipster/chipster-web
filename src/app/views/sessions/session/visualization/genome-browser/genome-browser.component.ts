import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  OnChanges,
  OnDestroy
} from "@angular/core";
import { VisualizationModalService } from "../visualizationmodal.service";
import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";
import { SessionData } from "../../../../../model/session/session-data";
import { TypeTagService } from "../../../../../shared/services/typetag.service";
import { Observable } from "rxjs/Observable";
import { Dataset } from "chipster-js-common";
import { Subject } from "rxjs/Subject";
import { LoadState, State } from "../../../../../model/loadstate";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import igv from 'igv';

declare var pileup: any;

export class BamSourceEntry {
  type = "alignment";
  format: "bam";
  url : string;
  name : string;


}

class BamSource {
  bamUrl: any;
  baiUrl: any;
  bamDataset: Dataset;
  baiDataset: Dataset;
}

@Component({
  selector: "ch-genome-browser",
  templateUrl: "genome-browser.component.html",
  styleUrls: ["./genome-browser.component.less"]
})


export class GenomeBrowserComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild("iframe")
  iframe: ElementRef;

  @Input()
  selectedDatasets: Array<any>;
  @Input()
  sessionData: SessionData;

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  private locus: any;
  private doc: any;
  private p: any;
  private content: any;
  private showGenomeBrowser: boolean;
  private selectedGenomeID: "hg38";

  // Multiple Bam related stuff
  private dataSourceList: Array<BamSource> = [];
  private sources: Array<BamSourceEntry> = [];

  private selectedGenomeUrl = "http://www.biodalliance.org/datasets/hg38.2bit";


  constructor(
    private visualizationModalService: VisualizationModalService,
    private selectionService: SelectionService,
    private sessionDataService: SessionDataService,
    private typeTagService: TypeTagService,
    private restErrorService: RestErrorService
  ) {}

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading data...");

    this.getDatasetUrls();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  setGenome(event) {
    this.selectedGenomeID = event;
    const self = this;
  
    // change the data source and load new pileup instance
  
  }

  getDatasetUrls() {
    const self = this;
    // if user have chosen one or more BAM files
    this.selectedDatasets.forEach(function(dataset) {
      // check type of each file, put the Bam datasets in list
      if (self.typeTagService.isCompatible(self.sessionData, dataset, "BAM")) {
        const bamSource = new BamSource();
        bamSource.bamDataset = dataset;
        self.sessionData.datasetsMap.forEach(function(dataset) {
          if (
            dataset.name.split(".").pop() === "bai" &&
            dataset.name.substr(0, dataset.name.indexOf(".")) ===
              bamSource.bamDataset.name.substr(
                0,
                bamSource.bamDataset.name.indexOf(".")
              )
          ) {
            bamSource.baiDataset = dataset;
          }
        });
        self.dataSourceList.push(bamSource);
      } else {
        self.state = new LoadState(
          State.Fail,
          "No corresponding BAI file found"
        );
      }
    });

    // don't continue if already failing
    if (this.state.state === State.Fail) {
      return;
    }

    let bam: Observable<any>;
    let bai: Observable<any>;
    const bamSources$: Array<any> = [];

    this.dataSourceList.forEach(function(bamSource) {
      if (bamSource.bamDataset && bamSource.baiDataset) {
        bam = self.sessionDataService.getDatasetUrl(bamSource.bamDataset);
        bai = self.sessionDataService.getDatasetUrl(bamSource.baiDataset);
        bamSources$.push(Observable.forkJoin(bam, bai));
      }
    });

    Observable.forkJoin(bamSources$)
      .takeUntil(this.unsubscribe)
      .subscribe(
        res => {
          for (let i = 0; i < res.length; i++) {
            this.dataSourceList[i].bamUrl = res[i][0];
            this.dataSourceList[i].baiUrl = res[i][1];
          }
       
          this.initializeDataSources();
          this.state = new LoadState(State.Ready);
        },
        (error: any) => {
          this.state = new LoadState(State.Fail, "Loading data failed");
          this.restErrorService.handleError(error, this.state.message);
        }
      );
  }

 
  

  initializeDataSources() {
    

    // console.log(this.sources);
    this.locus = "chr8:128,747,267-128,754,546";
  
  }

  openGnomeModal() {
    this.visualizationModalService.openVisualizationModal(
      this.selectionService.selectedDatasets[0],
      "genomebrowser"
    );
  }

  ngOnInit() {
   let igvDiv = document.getElementById("igv-div");
   for( let i= 0;  i < this.dataSourceList.length ; i++){
      let bamSourceEntry = new BamSourceEntry();
      
   }

  }
}


