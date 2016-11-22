"use strict";
var VennCircle = (function () {
    function VennCircle(datasetId, filename, data, circle) {
        this.datasetId = datasetId;
        this.filename = filename;
        this.data = data;
        this.circle = circle;
        datasetId;
        filename;
        data; // array of tuples containing symbol and identifier (both of which are nullable)
        circle;
    }
    return VennCircle;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VennCircle;
//# sourceMappingURL=venncircle.js.map