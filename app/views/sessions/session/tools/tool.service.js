angular.module('chipster-web').factory('ToolService', function () {

    var service = {};

    service.isSelectionParameter = function (parameter) {
        return parameter.type === 'ENUM' ||
            parameter.type === 'COLUMN_SEL' ||
            parameter.type === 'METACOLUMN_SEL';
    };

    service.isNumberParameter = function (parameter) {
        return parameter.type === 'INTEGER' ||
            parameter.type === 'DECIMAL' ||
            parameter.type === 'PERCENT';
    };

    service.getDefaultValue = function (toolParameter) {
        if(this.isNumberParameter(toolParameter)) {
            return Number(toolParameter.defaultValue);
        } else {
            return toolParameter.defaultValue;
        }
    };

    service.isCompatible = function(dataset, type) {

        // other than GENERIC should have more strict checks, like in  ChipsterInputTypes.isTypeOf()
        var alwaysCompatible = ['GENERIC', 'CDNA', 'GENE_EXPRS', 'GENELIST', 'PHENODATA'];

        if (alwaysCompatible.indexOf(type) !== -1) {
            return true;
        }

        var types = {
            // from BasicModule.plugContentTypes()
            TEXT: ['txt', 'dat', 'wee', 'seq', 'log', 'sam', 'fastq'],
            TSV: ['tsv'],
            CSV: ['csv'],
            PNG: ['png'],
            GIF: ['gif'],
            JPEG: ['jpg', 'jpeg'],
            PDF: ['pdf'],
            HTML: ['html', 'html'],
            // from MicroarrayModule.plugContentTypes()
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
    };

    return service;
});