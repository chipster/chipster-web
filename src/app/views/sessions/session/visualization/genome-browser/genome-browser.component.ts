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
    console.log(this.selectedGenomeID);
    var self = this;
    this.genomeList.forEach(function (genome) {
      if (event == genome.genomeID) {
        self.selectedGenomeUrl = genome.url;
      }
    });

    // change the data source and load new pileup instance
    if (this.p) {
      this.p.destroy();
      this.sources = [];
      this.initializeDataSources();
      this.loadPileUp();
    }

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
      this.initFrameContent();
      this.initializeDataSources();
    });


  }


  initFrameContent() {
    this.showGenomeBrowser = true;
    this.doc = this.iframe.nativeElement.contentWindow;
    this.doc.document.write(this.content);
    this.doc.close();

  }

  loadPileUp() {
    this.p = pileup.create(this.doc.document.getElementById('pileup'), {
      range: this.range,
      tracks: this.sources
    });
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
    this.loadPileUp();


  }


  openGnomeModal() {
    this.visualizationModalService.openVisualizationModal(this.selectionService.selectedDatasets[0], 'genomebrowser');
  }

  ngOnInit() {
    this.content = `<style>
  #pileup {position: absolute;left: 10px;right: 10px;top: 50px;bottom: 10px;}
  .pileup-root {display: flex;flex-direction: column;height: 100%;}
  .pileup-root > .track {display: flex;flex-direction: row;}
  .pileup-root text, .track-label {font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;}
  .track-label {flex: 0 0 100px;text-align: right;font-size: 0.9em;position: relative;}
  .track-label > span {padding-right: 5px;width: 100px;text-overflow: ellipsis;overflow: hidden;position: absolute;white-space: nowrap;right: 0;}
  .track.reference .track-label > span,
  .track.variants .track-label > span{bottom: 0;}
  .track-label > span:hover {overflow: visible !important;}
  .track-content {flex: 1; overflow-y: auto;overflow-x: hidden;position: relative;}
  .track-content > div {position: absolute; }
.track-content canvas {
  display: block;
}

/* controls */
.pileup-root > .controls {
  flex: 0 0 30px;  /* fixed height */
}
.pileup-root > .controls > .track-content {
  overflow: visible;
}
.pileup-root > .controls form.controls {
  margin-bottom: 0;  /* overrides browser default */
}
.pileup-root > .controls .zoom-controls {
  display: inline-block;
}
.pileup-root > .controls .btn-zoom-out:before {
  content: '-';
}
.pileup-root > .controls .btn-zoom-in:before {
  content: '+';
}
.pileup-root > .controls input,
.pileup-root > .controls button,
.pileup-root > .controls select,
.pileup-root > .controls option {
  font-size: 0.9em;
}

.gear {
  margin-left: 0.5em;
  font-size: 2em;
  color: #666;
}
.gear:hover {
  color: black;
}
.menu-container {
  z-index: 1;
  width: 250px;  /* not really 250px, but clears parent constraint */
}
.menu {
  border: 1px solid black;
  border-radius: 2px;
  display: table;
  background: white;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  text-align: left;
}
.menu-header {
  font-weight: bold;
  border-bottom: 1px solid #777;
  padding: 2px 4px;
}
.menu-item {
  padding: 4px;
}
.menu-separator {
  border-top: 1px solid #777;
  height: 0px;
}
.menu-item:hover {
  background: lightblue;
}

.check {
  display: inline-block;
  width: 1em;
}
.check.checked:before {
  content: '✓';
}

/* reference track */
.pileup-root > .reference {
  flex: 0 0 20px;  /* fixed height */
}

.background {
  fill: white;
}
.basepair.A { fill: #188712; }
.basepair.G { fill: #C45C16; }
.basepair.C { fill: #0600F9; }
.basepair.T { fill: #F70016; }
.basepair.U { fill: #F70016; }
.basepair text, text.basepair {
  text-anchor: middle;
}
.loose text {
  font-size: 24;
}
.tight text {
  font-size: 12;
  font-weight: bold;
}

/* gene track */
.pileup-root > .genes {
  flex: 0 0 50px;
}
.gene {
  stroke-width: 1;
  stroke: blue;
}
.gene text {
  font-size: 16px;
  text-anchor: middle;
  stroke: black;
  alignment-baseline: hanging;
}
#sense, #antisense .main {
  stroke: blue;
  fill: none;
  stroke-width: 1;
}
#antisense .offset, #sense .offset {
  stroke: white;
  fill: none;
  stroke-width: 1;
}
.exon {
  fill: blue;
  stroke: none;
}

/* pileup track */
.pileup-root > .pileup {
  flex: 1;  /* stretch to fill remaining space */
}
.pileup .alignment .match {
  fill: #c8c8c8;  /* matches IGV */
}
.pileup text.basepair {
  alignment-baseline: hanging;
  font-size: 12;
  font-weight: bold;
}
.pileup .insert {
  stroke: rgb(97, 0, 216);  /* matches IGV */
  stroke-width: 2;
}
.pileup .delete {
  stroke: black;
  stroke-width: 2;
}
.pileup .network-status {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  top: 30px;
}
.pileup .network-status-message {
  padding: 4px 8px;
  width: auto;
  background: #eee;
  border-radius: 3px;
  border: 1px solid #ccc;
  font-size: small;
  position: absolute;
  text-align: center;
}

.pileup .mate-connector {
  stroke: #c8c8c8;  /* matches IGV */
}

/* variants */
.pileup-root > .variants {
  flex: 0 0 25px;  /* fixed height */
}
.variants rect {
  fill: #ddd;
  stroke: blue;
}

/* coverage track */
.pileup-root > .coverage {
  flex: 0 0 50px;  /* fixed height */
}
.coverage rect.bin {
  stroke-width: 0.1;
  stroke: white;
  fill: #a0a0a0;
}
.coverage .y-axis {
  stroke: black;
  stroke-width: 1;
}
.coverage .y-axis g.tick text {
  color: black;
  font-size: x-small;
  stroke: whitesmoke;
  stroke-width: 2;
  paint-order: stroke;
}
.coverage .y-axis path {
  stroke-width: 0;
}
.coverage rect.y-axis-background {
  fill: white;
  opacity: 0.5;
}

/* location track */
.pileup-root > .location {
  flex: 0 0 20px;  /* fixed height */
}
.location .location-hline, .location .location-vline-left, .location .location-vline-right {
  stroke: gray;
  stroke-width: 1.5;
}
.location .location-label {
  color: black;
  font-size: smaller;
  text-anchor: start;
  dominant-baseline: central;
}

/* scale track */
.pileup-root > .scale {
  flex: 0 0 20px;  /* fixed height */
}
.scale .scale-lline, .scale .scale-rline {
  stroke: gray;
  stroke-width: 1.5;
}
.scale .scale-label {
  color: black;
  font-weight: bold;
  font-size: smaller;
  dominant-baseline: central;
  text-anchor: middle;
}

</style>
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


