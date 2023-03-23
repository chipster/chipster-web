import { Component, Input, OnInit } from "@angular/core";
import { UntypedFormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import { defer, of, Subject } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { LoadState, State } from "../../../../model/loadstate";
import { SessionData } from "../../../../model/session/session-data";
import { DatasetService, PairedEndSample, SampleGroups, SingleEndSample } from "../dataset.service";
import { SessionDataService } from "../session-data.service";

export interface ColumnItem {
  index: number;
  name: string;
}

@Component({
  selector: "ch-samples-modal",
  templateUrl: "./samples-modal.component.html",
  styleUrls: ["./samples-modal.component.less"],
})
export class SamplesModalComponent implements OnInit {
  constructor(
    public activeModal: NgbActiveModal,
    private fb: UntypedFormBuilder,
    private datasetService: DatasetService,
    private sessionDataService: SessionDataService
  ) {}

  @Input() datasets: Dataset[];
  @Input() sessionData: SessionData;

  identifiersForm = this.fb.group({
    r1Token: ["R1", Validators.required],
    r2Token: ["R2", Validators.required],
  });

  singleTokenForm = this.fb.group({
    singleToken: [""],
  });

  singleOrPairedForm = this.fb.group({
    singleOrPaired: ["paired"],
  });

  unpairedFiles: Dataset[] = [];
  pairedEndSamples: PairedEndSample[] = [];
  pairMissingSamples: PairedEndSample[] = [];
  singleEndSamples: SingleEndSample[] = [];
  sampleGroupNamesArray: string[] = []; // easier to use in the template

  nonUniqueWarning = false;
  nonUniqueWarningText = "";

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  ngOnInit(): void {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading data...");

    // check for nonunique file names
    const nonUniqueNames = this.findNonUniqueNames(this.datasets);
    if (nonUniqueNames.length > 0) {
      this.nonUniqueWarning = true;
      this.nonUniqueWarningText = `Selected files contain nonunique names: ${nonUniqueNames.join(", ")}`;
    }

    const sampleGroups: SampleGroups = this.datasetService.getSampleGroups(this.datasets);

    this.unpairedFiles = sampleGroups.sampleDataMissing;
    this.pairedEndSamples = sampleGroups.pairedEndSamples;
    this.pairMissingSamples = sampleGroups.pairMissingSamples;
    this.singleEndSamples = sampleGroups.singleEndSamples;

    this.state = new LoadState(State.Ready);
  }

  onFindSingle() {
    const singleToken = this.singleTokenForm.get("singleToken").value;
    const foundSingleEndSamples: SingleEndSample[] = this.datasetService.findSingleSampleFiles(
      this.unpairedFiles,
      singleToken
    );

    this.singleEndSamples.push(...foundSingleEndSamples);

    // remove found from undefined
    const foundDatasetIds: Set<string> = new Set(
      foundSingleEndSamples.map((singleEndSample) => singleEndSample.file.datasetId)
    );

    this.unpairedFiles = this.unpairedFiles.filter((dataset) => !foundDatasetIds.has(dataset.datasetId));
  }

  onFindPairs() {
    const r1Token = this.identifiersForm.get("r1Token").value;
    const r2Token = this.identifiersForm.get("r2Token").value;

    // find sample groups
    const foundPairedSamples: PairedEndSample[] = this.datasetService.findSamplePairs(
      this.unpairedFiles,
      r1Token,
      r2Token
    );

    //
    // TODO add several pairs / sample functionality
    // if (
    //   [...foundPairedSamples.keys()].some((foundSampleName, i) =>
    //     this.sampleGroupNamesArray.includes(foundSampleName)
    //   )
    // ) {
    //   // TODO add duplicate name to message
    //   this.dialogModalService.openNotificationModal(
    //     "Duplicate Sample Name",
    //     "Please reset pairs and try again."
    //   );
    //   return;
    // }

    this.pairedEndSamples.push(...foundPairedSamples);

    // remove found from unpaired
    const newlyPairedDatasetIds: Set<string> = new Set(
      this.datasetService.getPairedDatasets(foundPairedSamples).map((dataset) => dataset.datasetId)
    );
    this.unpairedFiles = this.unpairedFiles.filter((dataset) => !newlyPairedDatasetIds.has(dataset.datasetId));
  }

  onResetPairs() {
    this.unpairedFiles = this.unpairedFiles.concat(this.datasetService.getPairedDatasets(this.pairedEndSamples));
    this.pairedEndSamples = [];
  }

  onResetSingle() {
    this.unpairedFiles = this.unpairedFiles.concat(
      this.singleEndSamples.map((singleEndSample) => singleEndSample.file)
    );
    this.singleEndSamples = [];
  }

  onResetAll() {
    this.unpairedFiles = this.datasets;
    this.singleEndSamples = [];
    this.pairedEndSamples = [];
    this.pairMissingSamples = [];
  }

  onResetMissing() {
    this.unpairedFiles = this.unpairedFiles.concat(this.datasetService.getPairedDatasets(this.pairMissingSamples));
    this.pairMissingSamples = [];
  }

  /**
   * Creates the observable that performs the action,
   * closes the modal and returns the observable when closing the modal.
   *
   */
  public onSave(): void {
    // create the observable that does all the work

    const run$ = defer(() =>
      of(this.updateLocalDatasets()).pipe(
        mergeMap((updatedDatasets) => this.sessionDataService.updateDatasets(updatedDatasets))
      )
    );

    this.activeModal.close(run$);
  }

  /**
   * Update sample info from dialog to dataset metadata
   */
  private updateLocalDatasets(): Dataset[] {
    const updatedDatasets = [];

    // add sample data for single ended files
    this.singleEndSamples.forEach((singleEndSample) => {
      this.datasetService.setSampleData(singleEndSample.file, singleEndSample.sampleName, singleEndSample.sampleId);
      updatedDatasets.push(singleEndSample.file);
    });

    //  add sample data for paired files and paired end with missing other file
    this.pairedEndSamples.concat(this.pairMissingSamples).forEach((pairedEndSample: PairedEndSample) => {
      const { sampleName } = pairedEndSample;
      const { sampleId } = pairedEndSample;
      pairedEndSample.pairs.forEach((sampleFilePair) => {
        if (sampleFilePair.r1File != null) {
          this.datasetService.setSampleData(
            sampleFilePair.r1File,
            sampleName,
            sampleId,
            sampleFilePair.pairId,
            DatasetService.R1
          );
          updatedDatasets.push(sampleFilePair.r1File);
        }

        if (sampleFilePair.r2File != null) {
          this.datasetService.setSampleData(
            sampleFilePair.r2File,
            sampleName,
            sampleId,
            sampleFilePair.pairId,
            DatasetService.R2
          );
          updatedDatasets.push(sampleFilePair.r2File);
        }
      });
    });

    // remove sample data from unpaired files
    this.unpairedFiles.forEach((dataset) => {
      // avoid unnecessary update by checking if sample data exists
      if (this.datasetService.getMetadataFile(dataset, DatasetService.SAMPLE_DATA_FILENAME) != null) {
        this.datasetService.clearSampleData(dataset);
        updatedDatasets.push(dataset);
      }
    });

    return updatedDatasets;
  }

  getPluralEnd(count: number) {
    return count > 1 ? "s" : "";
  }

  private findNonUniqueNames(datasets: Dataset[]): string[] {
    const namesSet = new Set<string>();
    const nonUnique: string[] = [];
    datasets
      .map((dataset) => dataset.name)
      .forEach((name) => {
        if (namesSet.has(name)) {
          nonUnique.push(name);
        } else {
          namesSet.add(name);
        }
      });
    return nonUnique;
  }
}
