export default function () {

    var service = {};

    service.getFileExtension = function(name) {
        return name.split('.').pop();
    };

    service.startsWith = function(data, start) {
        return data.substring(0, start.length) === start;
    };

    service.mapValues = function(map) {
        var array = [];
        map.forEach( function(value) {
            array.push(value);
        });
        return array;
    };

    service.arrayToMap = function(array, key) {
        var map = new Map();
        for (var i = 0; i < array.length; i++) {
            map.set(array[i][key], array[i]);
        }
        return map;
    };

    service.isCtrlKey = function(event) {
        return event.metaKey || event.ctrlKey;
    };

    service.isShiftKey = function(event) {
        return event.shiftKey;
    };

    service.toggleSelection = function(event, item, allItems, selectedItems) {

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

        if (service.isCtrlKey(event)) {
            if (selectionContains(item)) {
                removeFromSelection(item);
            } else {
                addToSelection(item);
            }
        } else if (service.isShiftKey(event)) {
            if (!isSelectionEmpty()) {

                var lastSelectedItem = selectedItems[selectedItems.length - 1];
                var indexOfLastSelection = allItems.indexOf(lastSelectedItem);
                var indexOfNewSelection = allItems.indexOf(item);
                var from, to;
                if (indexOfLastSelection < indexOfNewSelection) {
                    from = indexOfLastSelection + 1;
                    to = indexOfNewSelection + 1;
                } else {
                    from = indexOfNewSelection;
                    to = indexOfLastSelection;
                }

                for (var i = from; i < to; i++) {
                    addToSelection(allItems[i]);
                }

            } else {
                setSelection(item);
            }

        } else {
            setSelection(item);
        }
    };

    return service;
};