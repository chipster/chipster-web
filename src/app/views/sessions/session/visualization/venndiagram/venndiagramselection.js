"use strict";
var _ = require("lodash");
var VennDiagramSelection = (function () {
    function VennDiagramSelection() {
        this.datasetIds = [];
        this.values = [];
    }
    VennDiagramSelection.prototype.addSelection = function (datasetIds, values) {
        this.datasetIds = _.uniq(this.datasetIds.concat(datasetIds));
        this.values = this.values.concat(values);
    };
    VennDiagramSelection.prototype.clearSelection = function () {
        this.datasetIds.length = 0;
        this.values.length = 0;
    };
    return VennDiagramSelection;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VennDiagramSelection;
//# sourceMappingURL=venndiagramselection.js.map