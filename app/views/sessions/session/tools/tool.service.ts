import Utils from "../../../../services/utils.service";
import ToolParameter from "../../../../model/session/toolparameter";
import Dataset from "../../../../model/session/dataset";
import InputBinding from "../../../../model/session/inputbinding";

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

    bindInputs(tool: any, datasets: Dataset[]) {

        // copy the array so that we can remove items from it
        var unboundDatasets = datasets.slice();

        // see OperationDefinition.bindInputs()
        //TODO handle multi-inputs
        datasets.forEach( item => {console.log('dataset', item)});

        var inputBindings: InputBinding[] = [];
        for (var j = 0; j < tool.inputs.length; j++) {
            var toolInput = tool.inputs[j];

            if (toolInput.type === 'PHENODATA') {
                // should we check that it exists?
                continue;
            }

            var found = false;

            for (var i = 0; i < unboundDatasets.length; i++) {

                var dataset = unboundDatasets[i];
                if (this.isCompatible(dataset, toolInput.type.name)) {

                    inputBindings.push({
                        toolInput: toolInput,
                        dataset: dataset
                    });
                    // remove from datasets
                    unboundDatasets.splice(unboundDatasets.indexOf(dataset), 1);
                    found = true;
                    break;
                }
            }
            if (!found) {
                // suitable datasets not found
                return null;
            }
        }

        return inputBindings;
    }

}
