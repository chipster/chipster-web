import { Injectable } from "@angular/core";
import { Dataset, PhenodataUtils } from "chipster-js-common";
import MetadataFile from "chipster-js-common/lib/model/metadata-file";
import * as d3 from "d3";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";
import UtilsService from "../../../shared/utilities/utils";

export interface Sample {
  sampleId: string;
  sampleName: string;
}

export interface SingleEndSample extends Sample {
  file: Dataset;
}

export interface PairedEndSample extends Sample {
  pairs: SampleFilePair[];
}

export interface SampleFilePair {
  pairId: string;
  r1File: Dataset;
  r2File: Dataset;
}

export interface SampleGroups {
  singleEndSamples: SingleEndSample[];
  pairedEndSamples: PairedEndSample[];
  pairMissingSamples: PairedEndSample[];
  sampleDataMissing: Dataset[];
}

@Injectable()
export class DatasetService {
  static readonly R1 = "R1";
  static readonly R2 = "R2";
  static readonly SAMPLE_DATA_FILENAME = "sample.json";

  readonly PHENODATA_PREFIX = "phenodata";
  readonly PHENODATA_FILENAME = "phenodata.tsv";
  readonly GROUP_COLOMN = "group";

  hasOwnPhenodata(dataset: Dataset): boolean {
    return PhenodataUtils.hasOwnPhenodata(dataset);
  }

  getOwnPhenodata(dataset: Dataset): string {
    return PhenodataUtils.getOwnPhenodata(dataset);
  }

  getOwnPhenodataFile(dataset: Dataset): MetadataFile {
    return PhenodataUtils.getOwnPhenodataFile(dataset);
  }

  isPhenodataFilled(dataset: Dataset): boolean {
    // TODO maybe use parent phenodata
    if (!this.hasOwnPhenodata(dataset)) {
      return false;
    }

    const allRows = d3.tsvParseRows(this.getOwnPhenodata(dataset));
    if (allRows.length < 2) {
      return false;
    }
    const headers = allRows[0];
    const groupIndex = headers.indexOf(this.GROUP_COLOMN);
    if (groupIndex === -1) {
      return false;
    }

    const contentRows = allRows.slice(1);
    return contentRows.every(
      (row) =>
        row.length === headers.length &&
        row[groupIndex] != null &&
        row[groupIndex] !== ""
    );
  }

  removeMetadataFile(dataset: Dataset, metadataName: string) {
    if (dataset.metadataFiles != null) {
      dataset.metadataFiles = dataset.metadataFiles.filter(
        (metadataFile) => metadataFile.name !== metadataName
      );
    }
  }

  getMetadataFile(dataset: Dataset, metadataName: string): MetadataFile {
    return dataset.metadataFiles?.find(
      (metadataFile) => metadataFile.name === metadataName
    );
  }

  addMetadataFile(dataset: Dataset, metadataFile: MetadataFile) {
    // remove possible previous metadata file with the same name
    this.removeMetadataFile(dataset, metadataFile.name);

    if (dataset.metadataFiles != null) {
      dataset.metadataFiles.push(metadataFile);
    } else {
      dataset.metadataFiles = [metadataFile];
    }
  }

  setPhenodata(dataset: Dataset, phenodata: string) {
    this.addMetadataFile(dataset, {
      name: this.PHENODATA_FILENAME,
      content: phenodata,
    });
  }

  setSampleData(
    dataset: Dataset,
    sampleName: string,
    sampleId: string,
    pairId?: string,
    direction?: string
  ) {
    // if pairId and direction undefined, they will not be included in the json
    const content = JSON.stringify({
      sampleName: sampleName,
      sampleId: sampleId,
      pairId: pairId,
      direction: direction,
    });

    this.addMetadataFile(dataset, {
      name: DatasetService.SAMPLE_DATA_FILENAME,
      content: content,
    });
  }

  clearSampleData(dataset: Dataset) {
    this.removeMetadataFile(dataset, DatasetService.SAMPLE_DATA_FILENAME);
  }

  findSingleSampleFiles(datasets: Dataset[], token: string): SingleEndSample[] {
    return datasets
      .filter((dataset) => dataset.name.includes(token))
      .map((dataset) => {
        return {
          file: dataset,
          sampleId: uuidv4(),
          sampleName: dataset.name,
        };
      });
  }

  findSamplePairs(
    datasets: Dataset[],
    r1Token = "R1",
    r2Token = "R2"
  ): PairedEndSample[] {
    const samplesArray: PairedEndSample[] = [];

    // r1 files
    const r1Files = datasets.filter((dataset) =>
      dataset.name.includes(r1Token)
    );

    // r2 files
    const r2Files = datasets.filter(
      (dataset) => !r1Files.includes(dataset) && dataset.name.includes(r2Token)
    );

    // find pair for each r1File
    r1Files.forEach((r1File) => {
      const sampleName = r1File.name.substring(
        0,
        r1File.name.lastIndexOf(r1Token)
      );
      const r2File = r2Files.find(
        (r2File) =>
          r2File.name.substring(0, r2File.name.lastIndexOf(r2Token)) ===
          sampleName
      );

      if (r2File != null) {
        samplesArray.push({
          sampleId: uuidv4(),
          sampleName: sampleName,
          pairs: [
            {
              pairId: uuidv4(),
              r1File: r1File,
              r2File: r2File,
            },
          ],
        });
      }
    });

    return samplesArray;
  }

  getSampleGroups(datasets: Dataset[]): SampleGroups {
    // find files with / without sample data
    const sampleDataExistsPartitions = UtilsService.partitionArray(
      datasets,
      (dataset) =>
        this.getMetadataFile(dataset, DatasetService.SAMPLE_DATA_FILENAME) !=
        null
    );
    const sampleDataMissing = sampleDataExistsPartitions[1];
    const filesWithSampleData = sampleDataExistsPartitions[0];

    // parse sample data here to do it only once
    const datasetsWithParsedSampleJson = filesWithSampleData.map((dataset) => {
      // get and parse sample.json
      const sampleDataFile = this.getMetadataFile(
        dataset,
        DatasetService.SAMPLE_DATA_FILENAME
      );
      const content = JSON.parse(sampleDataFile.content);
      return [dataset, content];
    });

    // sanity check, separate files with existing / missing
    const sampleIdExistsPartitions = UtilsService.partitionArray(
      datasetsWithParsedSampleJson,
      (datasetAndSampleData) => {
        const sampleData = datasetAndSampleData[1];
        return sampleData.sampleId != null;
      }
    );
    const datasetsAndSampleData = sampleIdExistsPartitions[0];
    const datasetsSampleIdMissing = sampleIdExistsPartitions[1];

    // if sampleId is missing -> consider it as sample data is missing
    datasetsSampleIdMissing.forEach(([dataset, sampleData]) => {
      log.warn("sampleId missing for", dataset.name);
      sampleDataMissing.push(dataset);
    });

    // partition to single end and paired end samples
    const singleAndPairedPartitions = UtilsService.partitionArray(
      datasetsAndSampleData,
      (datasetAndSampleData) => {
        const sampleData = datasetAndSampleData[1];
        return sampleData.pairId == null;
      }
    );
    const singleEndFilesWithSampleData = singleAndPairedPartitions[0];
    const pairedEndFilesWithSampleData = singleAndPairedPartitions[1];

    // create SingleEndSamples to return
    const singleEndSamples: SingleEndSample[] = singleEndFilesWithSampleData.map(
      ([dataset, sampleData]) => {
        return {
          sampleId: sampleData.sampleId,
          sampleName: sampleData.sampleName,
          file: dataset,
        };
      }
    );

    // create PairedEndSamples
    const pairedSamplesMap: Map<
      string,
      PairedEndSample
    > = this.getPairedSamplesMap(pairedEndFilesWithSampleData);

    // separate those with other file missing

    const noMissingPairsPartitions = UtilsService.partitionArray(
      Array.from(pairedSamplesMap.values()),
      (pairedEndSample) =>
        pairedEndSample.pairs.every(
          (sampleFilePair) =>
            sampleFilePair.r1File != null && sampleFilePair.r2File != null
        )
    );
    const pairedEndSamples: PairedEndSample[] = noMissingPairsPartitions[0];
    const pairMissingSamples: PairedEndSample[] = noMissingPairsPartitions[1];

    return {
      singleEndSamples: singleEndSamples,
      pairedEndSamples: pairedEndSamples,
      pairMissingSamples: pairMissingSamples,
      sampleDataMissing: sampleDataMissing,
    };
  }

  private getPairedSamplesMap(
    pairedEndFilesWithSampleData
  ): Map<string, PairedEndSample> {
    const pairedSamplesMap = new Map<string, PairedEndSample>();
    pairedEndFilesWithSampleData.map(([dataset, sampleData]) => {
      // check direction field
      if (
        sampleData.direction !== DatasetService.R1 &&
        sampleData.direction !== DatasetService.R2
      ) {
        throw new Error(
          "Illegal sample direction value: " +
            sampleData.value +
            " for " +
            dataset.name
        );
      }

      if (!pairedSamplesMap.has(sampleData.sampleId)) {
        // add new sample
        pairedSamplesMap.set(sampleData.sampleId, {
          sampleId: sampleData.sampleId,
          sampleName: sampleData.sampleName,
          pairs: [
            {
              pairId: sampleData.pairId,
              r1File:
                sampleData.direction === DatasetService.R1
                  ? dataset
                  : undefined,
              r2File:
                sampleData.direction === DatasetService.R2
                  ? dataset
                  : undefined,
            },
          ],
        });
      } else {
        // sample already exists
        const pairedEndSample = pairedSamplesMap.get(sampleData.sampleId);

        const index = pairedEndSample.pairs.findIndex(
          (filePair) => filePair.pairId === sampleData.pairId
        );
        if (index >= 0) {
          // pair already exists

          // check that file with the same direction doesn't exist yet
          if (
            (sampleData.direction === DatasetService.R1 &&
              pairedEndSample.pairs[index].r1File != null) ||
            (sampleData.direction === DatasetService.R2 &&
              pairedEndSample.pairs[index].r2File != null)
          ) {
            throw new Error(
              "File with the same direction already exists: " +
                dataset.name +
                " " +
                sampleData.direction
            );
          }
          // add to the pair
          if (sampleData.direction === DatasetService.R1) {
            pairedEndSample.pairs[index].r1File = dataset;
          } else if (sampleData.direction === DatasetService.R2) {
            pairedEndSample.pairs[index].r2File = dataset;
          } else {
            throw new Error(
              "Unknown direction " +
                sampleData.direction +
                " in sample data for " +
                dataset.name
            );
          }
        } else {
          // add new pair
          pairedEndSample.pairs.push({
            pairId: sampleData.pairId,
            r1File:
              sampleData.direction === DatasetService.R1 ? dataset : undefined,
            r2File:
              sampleData.direction === DatasetService.R2 ? dataset : undefined,
          });
        }
      }
    });

    return pairedSamplesMap;
  }

  /** Filters out nulls in case of missing pair */
  public getPairedDatasets(pairedEndSamples: PairedEndSample[]): Dataset[] {
    const datasets: Dataset[] = pairedEndSamples.reduce(
      (array, pairedSample) => {
        pairedSample.pairs.forEach((sampleFilePair) => {
          array.push(sampleFilePair.r1File, sampleFilePair.r2File);
        });
        return array;
      },
      []
    );
    return datasets.filter((dataset) => dataset != null);
  }

  public getSingleEndDatasets(singleEndSamples: SingleEndSample[]): Dataset[] {
    return singleEndSamples.map((singleEndSample) => singleEndSample.file);
  }
}
