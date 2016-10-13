import Utils from "../../../../services/utils.service";
import ToolParameter from "../../../../model/session/toolparameter";
import Dataset from "../../../../model/session/dataset";
import InputBinding from "../../../../model/session/inputbinding";
import Tool from "../../../../model/session/tool";
import ToolInput from "../../../../model/session/toolinput";

export default class ToolService{

    isSelectionParameter(parameter: ToolParameter) {
        return parameter.type === 'ENUM' ||
            parameter.type === 'COLUMN_SEL' ||
            parameter.type === 'METACOLUMN_SEL';
    };

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

    isCompatible(dataset: Dataset, type: string) {
        var alwaysCompatible = ['GENERIC', 'CDNA', 'GENE_EXPRS', 'GENELIST', 'PHENODATA'];
        if (alwaysCompatible.indexOf(type) !== -1) {
            return true;
        }
        var types = {
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
            SFF: ['sff']
        };
        var extension = Utils.getFileExtension(dataset.name);
        return types[type].indexOf(extension) !== -1;
    }


    bindInputs(tool: Tool, datasets: Dataset[]) : InputBinding[] {

        console.log("binding inputs for " + tool.name.displayName);
        // copy the array so that we can remove items from it
        var unboundDatasets = datasets.slice();

        // see OperationDefinition.bindInputs()
        //TODO handle multi-inputs

        var inputBindings: InputBinding[] = [];
        for (let toolInput of tool.inputs) {

            // ignore phenodata TODO should we check that it exists?
            if (toolInput.type === 'PHENODATA') {
                continue;
            }

            var found = false;
            let compatibleDatasets: Dataset[] = [];
            for (let dataset of unboundDatasets) {
                if (this.isCompatible(dataset, toolInput.type.name)) {
                    compatibleDatasets.push(dataset);

                    // remove from unbound datasets
                    unboundDatasets.splice(unboundDatasets.indexOf(dataset), 1);
                    found = true;

                    // only bind one dataset if not multi input
                    if (!this.isMultiInput(toolInput)) {
                        break;
                    }
                }
            }

            // binding this input ok
            if (found) {
                console.log("binding " + toolInput.name.id + ":");
                for (let dataset of compatibleDatasets) {
                    console.log("\t" + dataset.name);
                }
                inputBindings.push({
                    toolInput: toolInput,
                    datasets: compatibleDatasets
                });

            }

            // binding this input failed
            else {
                // suitable datasets not found
                console.log("binding " + toolInput.name.id + " failed");
                return null;
            }
        }

        return inputBindings;
    }

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
    getMultiInputId(input: ToolInput, index: number) : string {
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
