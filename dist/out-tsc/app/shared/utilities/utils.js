import * as _ from "lodash";
var UtilsService = (function () {
    function UtilsService() {
    }
    UtilsService.getFileExtension = function (name) {
        return name.split('.').pop();
    };
    UtilsService.startsWith = function (data, start) {
        return data.substring(0, start.length) === start;
    };
    UtilsService.mapValues = function (map) {
        var array = [];
        map.forEach(function (value) {
            array.push(value);
        });
        return array;
    };
    UtilsService.arrayToMap = function (array, key) {
        var map = new Map();
        for (var i = 0; i < array.length; i++) {
            map.set(array[i][key], array[i]);
        }
        return map;
    };
    UtilsService.isCtrlKey = function (event) {
        return event.metaKey || event.ctrlKey;
    };
    UtilsService.isShiftKey = function (event) {
        return event.shiftKey;
    };
    UtilsService.toggleSelection = function (event, item, allItems, selectedItems) {
        function isSelectionEmpty() {
            return selectedItems.length === 0;
        }
        function selectionContains(item) {
            return selectedItems.indexOf(item) !== -1;
        }
        function removeFromSelection(item) {
            var index = selectedItems.indexOf(item);
            selectedItems.splice(index, 1);
        }
        function addToSelection(item) {
            if (!selectionContains(item)) {
                selectedItems.push(item);
            }
        }
        function setSelection(item) {
            selectedItems.length = 0;
            selectedItems.push(item);
        }
        if (this.isCtrlKey(event)) {
            if (selectionContains(item)) {
                removeFromSelection(item);
            }
            else {
                addToSelection(item);
            }
        }
        else if (this.isShiftKey(event)) {
            if (!isSelectionEmpty()) {
                var lastSelectedItem = selectedItems[selectedItems.length - 1];
                var indexOfLastSelection = allItems.indexOf(lastSelectedItem);
                var indexOfNewSelection = allItems.indexOf(item);
                var from, to;
                if (indexOfLastSelection < indexOfNewSelection) {
                    from = indexOfLastSelection + 1;
                    to = indexOfNewSelection + 1;
                }
                else {
                    from = indexOfNewSelection;
                    to = indexOfLastSelection;
                }
                for (var i = from; i < to; i++) {
                    addToSelection(allItems[i]);
                }
            }
            else {
                setSelection(item);
            }
        }
        else {
            setSelection(item);
        }
    };
    UtilsService.getDatasetIds = function (datasets) {
        return datasets.map(function (dataset) { return dataset.datasetId; });
    };
    /**
     * Check that two given arrays contain same strings. Given parameter-arrays must be of equal length
     */
    UtilsService.equalStringArrays = function (first, second) {
        return _.every(first, function (item) {
            return _.includes(second, item);
        });
    };
    return UtilsService;
}());
export default UtilsService;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/utilities/utils.js.map