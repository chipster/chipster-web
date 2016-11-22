"use strict";
var utils_service_1 = require("./utils.service");
var _ = require("lodash");
var MapChangeDetector = (function () {
    /**
     * @param currentMap a funktion which returns the current map instance. Simple object reference would fail
     * if the instance is changed.
     * @param onChange a callback to call when a change is detected
     * @param comparison comparison type
     */
    function MapChangeDetector(currentMap, onChange, comparison) {
        this.currentMap = currentMap;
        this.onChange = onChange;
        this.comparison = comparison;
    }
    /**
     * Call the onChange funktion if the current map has changed after the last call of this method
     */
    MapChangeDetector.prototype.check = function () {
        var currentMapValues;
        if (this.currentMap()) {
            currentMapValues = utils_service_1.default.mapValues(this.currentMap());
        }
        if (!_.isEqual(currentMapValues, this.lastMapValues)) {
            this.onChange();
            if (this.comparison === Comparison.Deep) {
                // we need a deep copy to notice changes in the deep
                this.lastMapValues = _.cloneDeep(currentMapValues);
            }
            else if (this.comparison == Comparison.Shallow) {
                // the current instance is fine, because a new one is created on each call
                this.lastMapValues = currentMapValues;
            }
        }
    };
    return MapChangeDetector;
}());
exports.MapChangeDetector = MapChangeDetector;
var ArrayChangeDetector = (function () {
    /**
     * @param currentArray a funktion which returns the current array instance. Simple object reference would fail
     * if the instance is changed.
     * @param onChange a callback to call when a change is detected
     * @param comparison comparison type
     */
    function ArrayChangeDetector(currentArray, onChange, comparison) {
        this.currentArray = currentArray;
        this.onChange = onChange;
        this.comparison = comparison;
    }
    /**
     * Call the onChange funktion if the current array has changed after the last call of this method
     */
    ArrayChangeDetector.prototype.check = function () {
        if (!_.isEqual(this.currentArray(), this.lastArray)) {
            this.onChange();
            if (this.comparison === Comparison.Shallow) {
                // a copy of the array is needed to store the last state safely
                this.lastArray = _.concat([], this.currentArray());
            }
            else if (this.comparison === Comparison.Deep) {
                // we need a deep copy to notice changes in the deep
                this.lastArray = _.cloneDeep(this.currentArray());
            }
        }
    };
    return ArrayChangeDetector;
}());
exports.ArrayChangeDetector = ArrayChangeDetector;
(function (Comparison) {
    Comparison[Comparison["Shallow"] = 0] = "Shallow";
    Comparison[Comparison["Deep"] = 1] = "Deep";
})(exports.Comparison || (exports.Comparison = {}));
var Comparison = exports.Comparison;
//# sourceMappingURL=changedetector.service.js.map