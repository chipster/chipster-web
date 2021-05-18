import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import { defer, of, Subject } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { LoadState, State } from "../../../../model/loadstate";
import { SessionData } from "../../../../model/session/session-data";
import { DatasetService, PairedEndSample } from "../dataset.service";
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
    private fb: FormBuilder,
    private datasetService: DatasetService,
    private sessionDataService: SessionDataService
  ) {}

  @Input() datasets: Dataset[];
  @Input() sessionData: SessionData;

  identifiersForm = this.fb.group({
    r1Token: ["R1", Validators.required],
    r2Token: ["R2", Validators.required],
  });

  unpairedFiles: Dataset[] = [];
  pairedEndSamples: PairedEndSample[] = [];
  pairMissingSamples: PairedEndSample[] = [];
  sampleGroupNamesArray: string[] = []; // easier to use in the template

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  ngOnInit(): void {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading data...");

    const sampleGroups = this.datasetService.getSampleGroups(this.datasets);

    this.unpairedFiles = sampleGroups.sampleDataMissing;
    this.pairedEndSamples = sampleGroups.pairedEndSamples;
    this.pairMissingSamples = sampleGroups.pairMissingSamples;

    this.state = new LoadState(State.Ready);
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
      this.datasetService
        .getPairedDatasets(foundPairedSamples)
        .map((dataset) => dataset.datasetId)
    );
    this.unpairedFiles = this.unpairedFiles.filter(
      (dataset) => !newlyPairedDatasetIds.has(dataset.datasetId)
    );
  }

  onResetPairs() {
    this.unpairedFiles = this.unpairedFiles.concat(
      this.datasetService.getPairedDatasets(this.pairedEndSamples)
    );
    this.pairedEndSamples = [];
  }

  onResetAll() {
    this.unpairedFiles = this.datasets;
    this.pairedEndSamples = [];
    this.pairMissingSamples = [];
  }

  onResetMissing() {
    this.unpairedFiles = this.unpairedFiles.concat(
      this.datasetService.getPairedDatasets(this.pairMissingSamples)
    );
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
        mergeMap((updatedDatasets) => {
          return this.sessionDataService.updateDatasets(updatedDatasets);
        })
      )
    );

    this.activeModal.close(run$);
  }

  /**
   * Update sample info from dialog to dataset metadata
   */
  private updateLocalDatasets(): Dataset[] {
    const updatedDatasets = [];

    // TODO add single ended

    //  add sample data for paired files and paired end with missing other file
    this.pairedEndSamples
      .concat(this.pairMissingSamples)
      .forEach((pairedEndSample: PairedEndSample) => {
        const sampleName = pairedEndSample.sampleName;
        const sampleId = pairedEndSample.sampleId;
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
      if (
        this.datasetService.getMetadataFile(
          dataset,
          DatasetService.SAMPLE_DATA_FILENAME
        ) != null
      ) {
        this.datasetService.clearSampleData(dataset);
        updatedDatasets.push(dataset);
      }
    });

    return updatedDatasets;
  }

  getPluralEnd(count: number) {
    return count > 1 ? "s" : "";
  }
}
