import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import { Dataset } from "chipster-js-common";
import igv from "igv";
import { forkJoin as observableForkJoin, Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../../../model/loadstate";
import { SessionData } from "../../../../../model/session/session-data";
import { TypeTagService } from "../../../../../shared/services/typetag.service";
import { SelectionService } from "../../selection.service";
import { SessionDataService } from "../../session-data.service";
import { VisualizationModalService } from "../visualizationmodal.service";

export class BamSourceEntry {
  type = "alignment";
  format: "bam";
  url: string;
  name: string;
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
export class GenomeBrowserComponent implements OnInit, OnDestroy {
  @ViewChild("iframe", { static: false })
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

  private igvBrowser;
  constructor(
    private visualizationModalService: VisualizationModalService,
    private selectionService: SelectionService,
    private sessionDataService: SessionDataService,
    private typeTagService: TypeTagService,
    private restErrorService: RestErrorService
  ) {}

  loadTrack() {
    const trackConfigs = [];
    for (let i = 0; i < this.dataSourceList.length; i++) {
      trackConfigs.push({
        name: this.dataSourceList[i].bamDataset.name,
        type: "alignmnet",
        format: "bam",
        url: this.dataSourceList[i].bamUrl,
        indexURL: this.dataSourceList[i].baiUrl
      });
    }

    if (trackConfigs.length > 0) {
      this.igvBrowser.loadTrackList(trackConfigs);
    }
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
        // Do nothing for the time being
      }
    });

    let bam: Observable<any>;
    let bai: Observable<any>;
    const bamSources$: Array<any> = [];

    this.dataSourceList.forEach(function(bamSource) {
      if (bamSource.bamDataset && bamSource.baiDataset) {
        bam = self.sessionDataService.getDatasetUrl(bamSource.bamDataset);
        bai = self.sessionDataService.getDatasetUrl(bamSource.baiDataset);
        bamSources$.push(observableForkJoin(bam, bai));
      }
    });

    observableForkJoin(bamSources$)
      .pipe(takeUntil(this.unsubscribe))
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
          this.restErrorService.showError(this.state.message, error);
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
    const igvDiv = document.getElementById("igv-div");
    const options = {
      genome: "hg19"
    };
    console.log(igv);
    const self = this;
    igv
      .createBrowser(igvDiv, options)

      .then(function(browser) {
        console.log("Created IGV browser");
        self.getDatasetUrls();
        self.igvBrowser = browser;
        // self.loadTrack();
      });
  }
}
