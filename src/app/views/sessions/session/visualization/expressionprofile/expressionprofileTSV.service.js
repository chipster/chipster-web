"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require("@angular/core");
var geneexpression_1 = require("./geneexpression");
var domainboundaries_1 = require("./domainboundaries");
var _ = require("lodash");
var ExpressionProfileTSVService = (function () {
    function ExpressionProfileTSVService() {
    }
    /*
     * Get chipvalues from raw data
     */
    ExpressionProfileTSVService.prototype.getGeneExpressions = function (tsv) {
        var _this = this;
        var chipIndexes = this.getChipHeaderIndexes(tsv.headers);
        return _.map(tsv.body.rows, function (row) { return _this.getGeneExpressionsByIndex(row, chipIndexes); });
    };
    /*
     * max & min value from two-dimensional array
     */
    ExpressionProfileTSVService.prototype.getDomainBoundaries = function (tsv) {
        var chipIndexes = this.getChipHeaderIndexes(tsv.headers);
        var values = _.map(tsv.body.rows, function (row) { return row.getCellsByIndexes(chipIndexes); });
        var flatValues = _.map(_.flatten(values), function (value) { return parseFloat(value); });
        var min = _.min(flatValues);
        var max = _.max(flatValues);
        return new domainboundaries_1.default(min, max);
    };
    /*
     * Return array containing numbers indicating indexes for column headers starting with 'chip.'
     */
    ExpressionProfileTSVService.prototype.getChipHeaderIndexes = function (tsvHeaders) {
        return _.chain(tsvHeaders.headers)
            .map(function (cell, index) { return _.startsWith(cell, 'chip.') ? index : false; })
            .filter(function (cell) { return _.isNumber(cell); })
            .value();
    };
    /*
     * create new GeneExpression from data with given id
     */
    ExpressionProfileTSVService.prototype.getGeneExpression = function (tsv, id) {
        var chipIndexes = this.getChipHeaderIndexes(tsv.headers);
        var tsvRow = tsv.body.getTSVRow(id);
        return this.getGeneExpressionsByIndex(tsvRow, chipIndexes);
    };
    /*
     * Return a single GeneExpression based on id for the TSVRow and the values in indexes of row
     */
    ExpressionProfileTSVService.prototype.getGeneExpressionsByIndex = function (row, indexes) {
        var values = row.getCellsByIndexes(indexes);
        var numberValues = _.map(values, function (value) { return parseFloat(value); });
        return new geneexpression_1.default(row.id, numberValues);
    };
    /*
     * Order body by first chip-value in each row
     */
    ExpressionProfileTSVService.prototype.orderBodyByFirstValue = function (geneExpressions) {
        return _.orderBy(geneExpressions, [function (geneExpression) { return _.first(geneExpression.values); }]);
    };
    /*
     * Get chip-value headers
     */
    ExpressionProfileTSVService.prototype.getChipHeaders = function (tsv) {
        var chipHeaderIndexes = this.getChipHeaderIndexes(tsv.headers);
        return tsv.headers.getItemsByIndexes(chipHeaderIndexes);
    };
    return ExpressionProfileTSVService;
}());
ExpressionProfileTSVService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [])
], ExpressionProfileTSVService);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ExpressionProfileTSVService;
//# sourceMappingURL=expressionprofileTSV.service.js.map