import Utils from "../../../../services/Utils";
import ToolParameter from "../../../../model/session/toolparameter";
import Dataset from "../../../../model/session/dataset";

export default class {

    isSelectionParameter = function (parameter: ToolParameter) {
        return parameter.type === 'ENUM' ||
            parameter.type === 'COLUMN_SEL' ||
            parameter.type === 'METACOLUMN_SEL';
    };

    isNumberParameter = function (parameter: ToolParameter) {
        return parameter.type === 'INTEGER' ||
            parameter.type === 'DECIMAL' ||
            parameter.type === 'PERCENT';
    };

    getDefaultValue = function (toolParameter: ToolParameter): number | string {
        if (this.isNumberParameter(toolParameter)) {
            return Number(toolParameter.defaultValue);
        }
        else {
            return toolParameter.defaultValue;
        }
    };

    isCompatible = function (dataset: Dataset, type: string) {
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
}
