import Utils from "../../../../shared/utilities/utils";
import ToolParameter from "../../../../model/session/toolparameter";
import Dataset from "../../../../model/session/dataset";
import InputBinding from "../../../../model/session/inputbinding";
import Tool from "../../../../model/session/tool";
import ToolInput from "../../../../model/session/toolinput";
import {Injectable} from "@angular/core";

@Injectable()
export class ToolService {

  constructor() {
  }

  //noinspection JSMethodCanBeStatic
  isSelectionParameter(parameter: ToolParameter) {
    return parameter.type === 'ENUM' ||
      parameter.type === 'COLUMN_SEL' ||
      parameter.type === 'METACOLUMN_SEL';
  };

  //noinspection JSMethodCanBeStatic
  isNumberParameter(parameter: ToolParameter) {
    return parameter.type === 'INTEGER' ||
      parameter.type === 'DECIMAL' ||
      parameter.type === 'PERCENT';
  };

  getDefaultValue(toolParameter: ToolParameter): number | string {
    if (this.isNumberParameter(toolParameter)) {
      return Number(toolParameter.defaultValue);
    }
    else {
      return toolParameter.defaultValue;
    }
  };

  //noinspection JSMethodCanBeStatic
  isCompatible(dataset: Dataset, type: string) {
    const alwaysCompatible = ['GENERIC', 'CDNA', 'GENE_EXPRS', 'GENELIST', 'PHENODATA'];
    if (alwaysCompatible.indexOf(type) !== -1) {
      return true;
    }
    const types = {
      TEXT: ['txt', 'dat', 'wee', 'seq', 'log', 'sam', 'fastq'],
      TSV: ['tsv'],
      CSV: ['csv'],
      PNG: ['png'],
      GIF: ['gif'],
      JPEG: ['jpg', 'jpeg'],
      PDF: ['pdf'],
      HTML: ['html', 'html'],
      TRE: ['tre'],
      AFFY: ['cel'],
      BED: ['bed'],
      GTF: ['gtf', 'gff', 'gff2', 'gff3'],
      FASTA: ['fasta', 'fa', 'fna', 'fsa', 'mpfa'],
      FASTQ: ['fastq', 'fq'],
      GZIP: ['gz'],
      VCF: ['vcf'],
      BAM: ['bam'],
      QUAL: ['qual'],
      MOTHUR_OLIGOS: ['oligos'],
      MOTHUR_NAMES: ['names'],
      MOTHUR_GROUPS: ['groups'],
      MOTHUR_STABILITY: ['files'],
      MOTHUR_COUNT: ['count_table'],

      SFF: ['sff']
    };
    let extension = Utils.getFileExtension(dataset.name);
    return types[type].indexOf(extension) !== -1;
  }


  bindInputs(tool: Tool, datasets: Dataset[]): InputBinding[] {

    // copy the array so that we can remove items from it
    let unboundDatasets = datasets.slice();

    // see OperationDefinition.bindInputs()

    let inputBindings: InputBinding[] = [];

    // go through inputs, optional inputs last
    for (let toolInput of tool.inputs.filter(input => !input.optional).concat(tool.inputs.filter(input => input.optional))) {

      // ignore phenodata input, it gets generated on server side TODO should we check that it exists?
      if (toolInput.meta) {
        continue;
      }

      // get compatible datasets
      let compatibleDatasets = unboundDatasets.filter(dataset => this.isCompatible(dataset, toolInput.type.name));

      // if no compatible datasets found, skip to next input if optional input, otherwise fail
      if (compatibleDatasets.length < 1) {
        if (toolInput.optional) {
          continue;
        } else {
          console.log("binding failed for", toolInput.name.id, toolInput.type.name);
          return null;
        }
      }

      // pick the first or all if multi input
      let datasetsToBind = this.isMultiInput(toolInput) ? compatibleDatasets : compatibleDatasets.slice(0,1);

      inputBindings.push({
        toolInput: toolInput,
        datasets: datasetsToBind
      });

      let toolId = toolInput.name.id ? toolInput.name.id : toolInput.name.prefix + toolInput.name.postfix;
      console.log("binding", toolId, "->", datasetsToBind.reduce((a, b) => {
        return a + b.name + " " ;}, "").trim());

      // remove bound datasets from unbound
      unboundDatasets = _.difference(unboundDatasets, datasetsToBind);
    }

    return inputBindings;
  }

  //noinspection JSMethodCanBeStatic
  isMultiInput(input: ToolInput) {
    return (input.name.prefix && input.name.prefix.length > 0) ||
      (input.name.postfix && input.name.postfix.length > 0);
  }


  /** Return the id of the nth input instance of multi input
   *
   * E.g. microarray{...}.cel getMultiInputId(2) will return microarray003.cel
   *
   * NOTE: name indexing starts from 1, getMultiInputId(0) will return the first
   * multi input instance, which will be microarray001.cel
   *
   * NOTE: number is padded with zeros to always contain at least 3 digits
   *
   */
  getMultiInputId(input: ToolInput, index: number): string {
    if (!this.isMultiInput(input)) {
      return null;
    }

    // pad with zeros to three digits
    let digits: string = "" + index;
    if (digits.length < 3) {
      while (digits.length < 3) {
        digits = "0" + digits;
      }
    }

    return input.name.prefix + digits + input.name.postfix;
  }

  getCompatibleDatasets(toolInput: ToolInput, datasets: Dataset[]) {
    return datasets.filter(function (dataset: Dataset) {
      return this.isCompatible(dataset, toolInput.type.name);
    }.bind(this));
  };

}
