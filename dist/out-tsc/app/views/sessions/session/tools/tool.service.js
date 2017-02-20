var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import Utils from "../../../../shared/utilities/utils";
import { Injectable } from "@angular/core";
export var ToolService = (function () {
    function ToolService() {
    }
    ToolService.prototype.isSelectionParameter = function (parameter) {
        return parameter.type === 'ENUM' ||
            parameter.type === 'COLUMN_SEL' ||
            parameter.type === 'METACOLUMN_SEL';
    };
    ;
    ToolService.prototype.isNumberParameter = function (parameter) {
        return parameter.type === 'INTEGER' ||
            parameter.type === 'DECIMAL' ||
            parameter.type === 'PERCENT';
    };
    ;
    ToolService.prototype.getDefaultValue = function (toolParameter) {
        if (this.isNumberParameter(toolParameter)) {
            return Number(toolParameter.defaultValue);
        }
        else {
            return toolParameter.defaultValue;
        }
    };
    ;
    ToolService.prototype.isCompatible = function (dataset, type) {
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
    };
    ToolService.prototype.bindInputs = function (tool, datasets) {
        // copy the array so that we can remove items from it
        var unboundDatasets = datasets.slice();
        // see OperationDefinition.bindInputs()
        //TODO handle multi-inputs
        var inputBindings = [];
        for (var _i = 0, _a = tool.inputs; _i < _a.length; _i++) {
            var toolInput = _a[_i];
            // ignore phenodata TODO should we check that it exists?
            if (toolInput.type === 'PHENODATA') {
                continue;
            }
            var found = false;
            var compatibleDatasets = [];
            for (var _b = 0, unboundDatasets_1 = unboundDatasets; _b < unboundDatasets_1.length; _b++) {
                var dataset = unboundDatasets_1[_b];
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
                inputBindings.push({
                    toolInput: toolInput,
                    datasets: compatibleDatasets
                });
            }
            else {
                // suitable datasets not found
                console.warn("binding " + toolInput.name.id + " failed");
                return null;
            }
        }
        return inputBindings;
    };
    ToolService.prototype.isMultiInput = function (input) {
        return (input.name.prefix && input.name.prefix.length > 0) ||
            (input.name.postfix && input.name.postfix.length > 0);
    };
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
    ToolService.prototype.getMultiInputId = function (input, index) {
        if (!this.isMultiInput(input)) {
            return null;
        }
        // pad with zeros to three digits
        var digits = "" + index;
        if (digits.length < 3) {
            while (digits.length < 3) {
                digits = "0" + digits;
            }
        }
        return input.name.prefix + digits + input.name.postfix;
    };
    ToolService.prototype.getCompatibleDatasets = function (toolInput, datasets) {
        return datasets.filter(function (dataset) {
            return this.isCompatible(dataset, toolInput.type.name);
        }.bind(this));
    };
    ;
    ToolService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [])
    ], ToolService);
    return ToolService;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/tools/tool.service.js.map