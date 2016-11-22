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
var point_1 = require("../model/point");
var twocirclevenndiagram_service_1 = require("./twocirclevenndiagram.service");
var threecirclevenndiagram_service_1 = require("./threecirclevenndiagram.service");
var venndiagramtext_1 = require("./venndiagramtext");
var _ = require("lodash");
var VennDiagramService = (function () {
    function VennDiagramService(twoCircleVenndiagramService, threeCircleVenndiagramService) {
        this.twoCircleVenndiagramService = twoCircleVenndiagramService;
        this.threeCircleVenndiagramService = threeCircleVenndiagramService;
    }
    VennDiagramService.prototype.getCircleCenterPoints = function (fileCount, visualizationAreaCenter, radius) {
        return fileCount === 2 ? this.twoCircleVenndiagramService.getCenterPoints(visualizationAreaCenter, radius) : this.threeCircleVenndiagramService.getCenterPoints(visualizationAreaCenter, radius);
    };
    VennDiagramService.prototype.getSelectionDescriptor = function (circles, selectionCircles, radius, visualizationCenter) {
        return circles.length === 2 ? this.twoCircleVenndiagramService.getSelectionDescriptor(circles, selectionCircles, radius) : this.threeCircleVenndiagramService.getSelectionDescriptor(circles, selectionCircles, radius, visualizationCenter);
    };
    /*
     * @description: get intersection data of given circles
     */
    VennDiagramService.prototype.getDataIntersection = function (selectionCircles, allCircles, columnKey) {
        var differenceCircles = allCircles.filter(function (circle) { return !_.includes(selectionCircles, circle); });
        return this.getSelectionData(selectionCircles, differenceCircles, columnKey);
    };
    /*
     * @description: return the intersection of selectionCircles data minus the datas of difference circles
     */
    VennDiagramService.prototype.getSelectionData = function (selectionCircles, difference, columnKey) {
        var compareByIndex = columnKey === 'symbol' ? 0 : 1;
        // all values from selected circles
        var values = selectionCircles.map(function (vennCircle) { return vennCircle.data; });
        // intersecting values from selected circles
        var intersection = _.intersectionBy.apply(_, values.concat([compareByIndex]));
        // all values from difference circles (circles that aren't selected)
        var differenceValues = difference.map(function (vennCircle) { return vennCircle.data; });
        // intersecting values from selected circles minus values in difference circles
        return _.differenceBy.apply(_, [intersection].concat(differenceValues, [compareByIndex]));
    };
    /*
     * @description: Create new TSVFile based on selected values
     */
    VennDiagramService.prototype.generateNewDatasetTSV = function (files, selection, columnKey) {
        var _this = this;
        var columnKeyIndex = columnKey === 'symbol' ? 0 : 1;
        // all headers from given files
        var headers = _.chain(files)
            .map(function (file) { return file.headers.headers; })
            .flatten()
            .uniq()
            .value();
        var body = [];
        _.forEach(selection.datasetIds, function (datasetId) {
            var file = _.find(files, function (file) { return file.datasetId === datasetId; });
            var values = _.flatMap(selection.values, function (valueTuple) { return valueTuple[columnKeyIndex]; });
            var keyColumnIndex = file.getColumnIndex(columnKey); // index where the values are collected
            _.forEach(files, function (file) {
                var rows = _this.getTSVRowsContainingValues(file, values, keyColumnIndex);
                var sortedIndexMapping = _this.getSortedIndexMapping(file, headers);
                var sortedRows = _this.rearrangeCells(rows, sortedIndexMapping);
                body = body.concat(sortedRows);
            });
        });
        return [headers].concat(body);
    };
    /*
     * @description: map given tsv bodyrows items to new indexes in
     */
    VennDiagramService.prototype.rearrangeCells = function (tsvRows, sortingMap) {
        return tsvRows.map(function (tsvRow) {
            var sortedRow = [];
            sortingMap.forEach(function (key, index) {
                sortedRow[index] = tsvRow.getCellByIndex(key);
            });
            return sortedRow;
        });
    };
    /*
     * @description: Find out rows which contain a value from values-array in the given column
     */
    VennDiagramService.prototype.getTSVRowsContainingValues = function (file, values, columnIndex) {
        return _.chain(file.body.rows)
            .filter(function (row) { return _.includes(values, row.getCellByIndex(columnIndex)); })
            .value();
    };
    /*
     * @description: Get column indexes for given header-keys in file
     */
    VennDiagramService.prototype.getSortedIndexMapping = function (file, headers) {
        var mapping = new Map();
        headers.forEach(function (header, index) { mapping.set(index, file.getColumnIndex(header)); });
        return mapping;
    };
    /*
     * @description: find out position for text containing circles filename and its item count
     */
    VennDiagramService.prototype.getVennCircleFilenamePoint = function (vennCircle, visualizationAreaCenter) {
        if (vennCircle.circle.center.x === visualizationAreaCenter.x) {
            return new point_1.default(visualizationAreaCenter.x - vennCircle.circle.radius * 0.5, vennCircle.circle.center.y - vennCircle.circle.radius - 3);
        }
        else if (vennCircle.circle.center.x < visualizationAreaCenter.x) {
            return new point_1.default(vennCircle.circle.center.x - vennCircle.circle.radius * 1.2, vennCircle.circle.center.y + vennCircle.circle.radius + 5);
        }
        else {
            return new point_1.default(vennCircle.circle.center.x + vennCircle.circle.radius * 0.8, vennCircle.circle.center.y + vennCircle.circle.radius + 5);
        }
    };
    /*
     * @description: get count of items and positions for texts in each segment
     */
    VennDiagramService.prototype.getVennDiagramSegmentTexts = function (vennCircles, visualizationAreaCenter, columnKey) {
        return vennCircles.length === 2 ? this.getTwoVennDiagramSegmentTexts(vennCircles, visualizationAreaCenter, columnKey) : this.getThreeVennDiagramSegmentTexts(vennCircles, visualizationAreaCenter, columnKey);
    };
    /*
     * @description: get position for venn diagrams segment where the count of it's items is displayed
     */
    VennDiagramService.prototype.getTwoVennDiagramSegmentTexts = function (circles, visualizationAreaCenter, columnKey) {
        var result = [];
        var leftCircle = (circles[0].circle.center.x < visualizationAreaCenter.x) ? circles[0] : circles[1];
        var rightCircle = (circles[0].circle.center.x > visualizationAreaCenter.x) ? circles[0] : circles[1];
        //intersection
        var intersectionCount = this.getSelectionData(circles, [], columnKey).length.toString();
        result.push(new venndiagramtext_1.default(intersectionCount, visualizationAreaCenter));
        // left circle
        var leftCircleCount = this.getSelectionData([leftCircle], [rightCircle], columnKey).length.toString();
        var leftCirclePosition = new point_1.default(leftCircle.circle.center.x - leftCircle.circle.radius * 0.5, leftCircle.circle.center.y);
        result.push(new venndiagramtext_1.default(leftCircleCount, leftCirclePosition));
        // right circle
        var rightCircleCount = this.getSelectionData([rightCircle], [leftCircle], columnKey).length.toString();
        var rightCirclePosition = new point_1.default(rightCircle.circle.center.x + rightCircle.circle.radius * 0.5, rightCircle.circle.center.y);
        result.push(new venndiagramtext_1.default(rightCircleCount, rightCirclePosition));
        return result;
    };
    /*
     * @description: get position for venn diagrams segment where the count of it's items is displayed
     */
    VennDiagramService.prototype.getThreeVennDiagramSegmentTexts = function (circles, visualizationAreaCenter, columnKey) {
        var result = [];
        var radius = circles[0].circle.radius;
        var circlesSortedByXAxis = _.sortBy(circles, function (circle) { return circle.circle.center.x; });
        // circles sorted by x-axis value
        var bottomLeftCircle = circlesSortedByXAxis[0];
        var topCircle = circlesSortedByXAxis[1];
        var bottomRightCircle = circlesSortedByXAxis[2];
        var intersectionAllCirclesCount = this.getSelectionData(circles, [], columnKey).length.toString();
        result.push(new venndiagramtext_1.default(intersectionAllCirclesCount, visualizationAreaCenter));
        var intersectionBottomLeftTopCirclesCount = this.getSelectionData([bottomLeftCircle, topCircle], [bottomRightCircle], columnKey).length.toString();
        var intersectionBottomLeftTopCirclesPosition = new point_1.default(visualizationAreaCenter.x - radius * 0.6, visualizationAreaCenter.y - radius * 0.2);
        result.push(new venndiagramtext_1.default(intersectionBottomLeftTopCirclesCount, intersectionBottomLeftTopCirclesPosition));
        var intersectionBottomRightTopCirclesCount = this.getSelectionData([topCircle, bottomRightCircle], [bottomLeftCircle], columnKey).length.toString();
        var intersectionBottomRightTopCirclesPosition = new point_1.default(visualizationAreaCenter.x + radius * 0.6, visualizationAreaCenter.y - radius * 0.2);
        result.push(new venndiagramtext_1.default(intersectionBottomRightTopCirclesCount, intersectionBottomRightTopCirclesPosition));
        var intersectionBottomRightBottomLeftCirclesCount = this.getSelectionData([bottomLeftCircle, bottomRightCircle], [topCircle], columnKey).length.toString();
        var intersectionBottomRightBottomLeftCirclesPosition = new point_1.default(visualizationAreaCenter.x, visualizationAreaCenter.y + radius);
        result.push(new venndiagramtext_1.default(intersectionBottomRightBottomLeftCirclesCount, intersectionBottomRightBottomLeftCirclesPosition));
        var bottomLeftCircleCount = this.getSelectionData([bottomLeftCircle], [topCircle, bottomRightCircle], columnKey).length.toString();
        var bottomLeftCirclePosition = new point_1.default(bottomLeftCircle.circle.center.x - radius * 0.5, bottomLeftCircle.circle.center.y);
        result.push(new venndiagramtext_1.default(bottomLeftCircleCount, bottomLeftCirclePosition));
        var topCircleCount = this.getSelectionData([topCircle], [bottomLeftCircle, bottomRightCircle], columnKey).length.toString();
        var topCirclePosition = new point_1.default(topCircle.circle.center.x, topCircle.circle.center.y - radius * 0.3);
        result.push(new venndiagramtext_1.default(topCircleCount, topCirclePosition));
        var bottomRightCircleCount = this.getSelectionData([bottomRightCircle], [topCircle, bottomLeftCircle], columnKey).length.toString();
        var bottomRightCirclePosition = new point_1.default(bottomRightCircle.circle.center.x + radius * 0.3, bottomRightCircle.circle.center.y);
        result.push(new venndiagramtext_1.default(bottomRightCircleCount, bottomRightCirclePosition));
        return result;
    };
    return VennDiagramService;
}());
VennDiagramService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [twocirclevenndiagram_service_1.default, threecirclevenndiagram_service_1.default])
], VennDiagramService);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VennDiagramService;
//# sourceMappingURL=venndiagram.service.js.map