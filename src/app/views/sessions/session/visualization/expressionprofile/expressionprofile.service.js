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
var _ = require("lodash");
var line_1 = require("./line");
var expressionprofileTSV_service_1 = require("./expressionprofileTSV.service");
var core_1 = require("@angular/core");
var ExpressionProfileService = (function () {
    function ExpressionProfileService(expressionprofileTSVService) {
        this.expressionprofileTSVService = expressionprofileTSVService;
    }
    // X-axis indexes for intervals the selection rectangle is crossing
    ExpressionProfileService.prototype.getCrossingIntervals = function (p1, p2, linearXScale, tsv) {
        var startIndex = this.getFloor(linearXScale.invert(p1.x), linearXScale.invert(p2.x));
        var endIndex = this.getCeil(linearXScale.invert(p1.x), linearXScale.invert(p2.x));
        if (startIndex < 0) {
            startIndex = 0;
        }
        if (endIndex >= this.expressionprofileTSVService.getChipHeaders(tsv).length - 1) {
            endIndex = this.expressionprofileTSVService.getChipHeaders(tsv).length - 1;
        }
        return {
            start: startIndex,
            end: endIndex
        };
    };
    ExpressionProfileService.prototype.getFloor = function (first, second) {
        return first <= second ? _.floor(first) : _.floor(second);
    };
    ExpressionProfileService.prototype.getCeil = function (first, second) {
        return first >= second ? _.ceil(first) : _.ceil(second);
    };
    ExpressionProfileService.prototype.createLines = function (tsv, chipIndex, linearXScale, yScale) {
        var _this = this;
        return _.map(tsv.body.rows, (function (tsvRow) {
            // get indexes for finding raw data value for lines start and end points
            var chipIndexes = _this.expressionprofileTSVService.getChipHeaderIndexes(tsv.headers);
            var chipLineStartDataIndex = chipIndexes[chipIndex];
            var chipLineEndDataIndex = chipIndexes[chipIndex + 1];
            // get raw data for lines start and end points
            var lineStartValue = tsvRow.row[chipLineStartDataIndex];
            var lineEndValue = tsvRow.row[chipLineEndDataIndex];
            return _this.createLine(tsvRow.id, chipIndex, lineStartValue, lineEndValue, linearXScale, yScale);
        }));
    };
    ExpressionProfileService.prototype.createLine = function (lineId, chipValueIndex, lineStartValue, lineEndValue, linearXScale, yScale) {
        // get pixel values for lines start and end positions
        var _a = [linearXScale(chipValueIndex), yScale(lineStartValue)], x1 = _a[0], y1 = _a[1];
        var _b = [linearXScale(chipValueIndex + 1), yScale(lineEndValue)], x2 = _b[0], y2 = _b[1];
        return new line_1.default(lineId, x1, y1, x2, y2);
    };
    // Check if line intersecting with rectangle
    ExpressionProfileService.prototype.isIntersecting = function (line, rectangle) {
        // Completely outside.
        if ((line.start.x <= rectangle.topleft.x && line.end.x <= rectangle.topleft.x) ||
            (line.start.y <= rectangle.topleft.y && line.end.y <= rectangle.topleft.y) ||
            (line.start.x >= rectangle.bottomright.x && line.end.x >= rectangle.bottomright.x) ||
            (line.start.y >= rectangle.bottomright.y && line.end.y >= rectangle.bottomright.y)) {
            return false;
        }
        var m = (line.end.y - line.start.y) / (line.end.x - line.start.x);
        var y = m * (rectangle.topleft.x - line.start.x) + line.start.y;
        if (y > rectangle.topleft.y && y < rectangle.bottomright.y)
            return true;
        y = m * (rectangle.bottomright.x - line.start.x) + line.start.y;
        if (y > rectangle.topleft.y && y < rectangle.bottomright.y)
            return true;
        var x = (rectangle.topleft.y - line.start.y) / m + line.start.x;
        if (x > rectangle.topleft.x && x < rectangle.bottomright.x)
            return true;
        x = (rectangle.bottomright.y - line.start.y) / m + line.start.x;
        if (x > rectangle.topleft.x && x < rectangle.bottomright.x)
            return true;
        return false;
    };
    return ExpressionProfileService;
}());
ExpressionProfileService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [expressionprofileTSV_service_1.default])
], ExpressionProfileService);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ExpressionProfileService;
//# sourceMappingURL=expressionprofile.service.js.map