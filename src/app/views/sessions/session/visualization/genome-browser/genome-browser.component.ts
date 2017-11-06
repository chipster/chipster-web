import {Component, OnInit, Input, ViewChild, ElementRef} from '@angular/core';
import * as pileup from "pileup";
import {VisualizationModalService} from "../visualizationmodal.service";
import {SelectionService} from "../../selection.service";
import {SessionDataService} from "../../sessiondata.service";
import {SessionData} from "../../../../../model/session/session-data";
import {TypeTagService} from "../../../../../shared/services/typetag.service";
import {Observable} from 'rxjs/Observable';
import Dataset from "../../../../../model/session/dataset";


@Component({
  selector: 'ch-genome-browser',
  templateUrl: 'genome-browser.component.html',
  styleUrls: ['./genome-browser.component.less']

})
export class GenomeBrowserComponent implements OnInit {

  @ViewChild('iframe') iframe: ElementRef;

  @Input() selectedDatasets: Array<any>;
  @Input() sessionData: SessionData;

  private range: any;
  private doc: any;
  private p: any;
  private content: any;
  errorMessage: string;
  private showGenomeBrowser: boolean;
  private selectedGenomeID: string = 'hg38';

  //Multiple Bam related stuff
  private dataSourceList: Array<BamSource> = [];
  private sources: Array<BamSourceEntry> = [];


  private selectedGenomeUrl: string = 'http://www.biodalliance.org/datasets/hg38.2bit';

  private genomeList = [
    {
      genomeID: 'hg19',
      url: 'http://www.biodalliance.org/datasets/hg19.2bit'
    },
    {
      genomeID: 'hg38',
      url: 'http://www.biodalliance.org/datasets/hg38.2bit'
    }
  ];

  constructor(private visualizationModalService: VisualizationModalService,
              private selectionService: SelectionService,
              private sessionDataService: SessionDataService,
              private typeTagService: TypeTagService) {


  }


  ngOnChanges() {
    this.getDatasetUrls();

  }

  setGenome(event) {
    this.selectedGenomeID = event;
    var self = this;
    this.genomeList.forEach(function (genome) {
      if (event == genome.genomeID) {
        self.selectedGenomeUrl = genome.url;
      }
    });
  }


  getDatasetUrls() {
    var self = this;
    // if user have chosen one or more BAM files
    this.selectedDatasets.forEach(function (dataset) {
      // check type of each file, put the Bam datasets in list
      if (self.typeTagService.isCompatible(self.sessionData, dataset, "BAM")) {
        let bamSource = new BamSource();
        bamSource.bamDataset = dataset;
        self.sessionData.datasetsMap.forEach(function (dataset) {
          if (((dataset.name.split('.').pop()) == "bai") && ((dataset.name.substr(0,
              dataset.name.indexOf('.')) === (bamSource.bamDataset.name.substr(0,
              bamSource.bamDataset.name.indexOf('.')))))) {
            bamSource.baiDataset = dataset;
          }

        });
        self.dataSourceList.push(bamSource);
      }
      else {
        self.errorMessage = "Could not find corresponding BAI file";
      }
    });


    let bam: Observable<any>;
    let bai: Observable<any>;
    let bamSources$: Array<any> = [];

    this.dataSourceList.forEach(function (bamSource) {
      if (bamSource.bamDataset && bamSource.baiDataset) {

        bam = self.sessionDataService.getDatasetUrl(bamSource.bamDataset);
        bai = self.sessionDataService.getDatasetUrl(bamSource.baiDataset);
        bamSources$.push(Observable.forkJoin(bam, bai));
      }
    });

    Observable.forkJoin(bamSources$).subscribe(res => {
      for (let i = 0; i < res.length; i++) {
        this.dataSourceList[i].bamUrl = res[i][0];
        this.dataSourceList[i].baiUrl = res[i][1];

      }
      this.initializeDataSources();
    });


  }


  loadGenomeBrowser() {
    this.showGenomeBrowser = true;
    this.doc = this.iframe.nativeElement.contentWindow;
    this.doc.document.write(this.content);

    this.p = pileup.create(this.doc.document.getElementById('pileup'), {
      range: this.range,
      tracks: this.sources
    });

    this.doc.close();

  }


  initializeDataSources() {
    let refGenome = new BamSourceEntry();

    refGenome.viz = pileup.viz.genome();
    refGenome.isReference = true;
    refGenome.data = pileup.formats.twoBit({
      url: this.selectedGenomeUrl
    });
    refGenome.name = 'Reference';

    this.sources.push(refGenome);

    var scale = new BamSourceEntry();
    scale.viz = pileup.viz.scale();
    scale.name = 'Scale';

    this.sources.push(scale);

    var location = new BamSourceEntry();
    location.viz = pileup.viz.location();
    location.name = 'Location';

    this.sources.push(location);

    var genes = new BamSourceEntry();
    genes.viz = pileup.viz.genes();
    genes.data = pileup.formats.bigBed({
      url: 'http://www.biodalliance.org/datasets/ensGene.bb'
    });
    genes.name = 'Genes';


    this.sources.push(genes);


    for (var i = 0; i < this.dataSourceList.length; i++) {
      var bamCoverageEntry = new BamSourceEntry();
      var bamTrackEntry = new BamSourceEntry();


      bamCoverageEntry.viz = pileup.viz.coverage();
      bamCoverageEntry.data = pileup.formats.bam({
        url: this.dataSourceList[i].bamUrl,
        indexUrl: this.dataSourceList[i].baiUrl
      });
      bamCoverageEntry.cssClass = "normal";
      bamCoverageEntry.name = 'Coverage';


      bamTrackEntry.viz = pileup.viz.pileup();
      bamTrackEntry.data = pileup.formats.bam({
        url: this.dataSourceList[i].bamUrl,
        indexUrl: this.dataSourceList[i].baiUrl
      });
      bamTrackEntry.cssClass = 'normal';
      bamTrackEntry.name = 'Alignments';

      this.sources.push(bamCoverageEntry);
      this.sources.push(bamTrackEntry);

    }


    //console.log(this.sources);
    this.range = {contig: 'chr20', start: 3976345, stop: 3979545};

    //this.range = {contig: 'chr1', start: 7500000, stop: 7500500};

    // need to test with GM12878.bam and position 3977895

    this.loadGenomeBrowser();

  }


  openGnomeModal() {
    this.visualizationModalService.openVisualizationModal(this.selectionService.selectedDatasets[0], 'genomebrowser');
  }


  ngOnInit() {
    this.content = `<link rel="stylesheet" type="text/css" href="../../../../../assets/pileup.css">
    <div id="pileup">
    </div>`;


    //let pileup = window['pileup'];

  }
}

class BamSourceEntry {
  viz: any;
  isReference?: boolean
  data?: any;
  cssClass?: any;
  name?: any;
  options?: any;

}


class BamSource {
  bamUrl: any;
  baiUrl: any;
  bamDataset: Dataset;
  baiDataset: Dataset;
}


