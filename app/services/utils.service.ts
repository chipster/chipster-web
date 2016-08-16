export default class UtilsService {

    static getFileExtension(name: string) {
        return name.split('.').pop();
    }

    static startsWith(data: string, start: string) {
        return data.substring(0, start.length) === start;
    }

    static mapValues(map: Map<any, any>) {
        var array: any[] = [];
        map.forEach( function(value: any) {
            array.push(value);
        });
        return array;
    }

    static arrayToMap(array: any[], key: string) {
        var map = new Map();
        for (var i = 0; i < array.length; i++) {
            map.set(array[i][key], array[i]);
        }
        return map;
    }

    static isCtrlKey(event: any) {
        return event.metaKey || event.ctrlKey;
    }

    static isShiftKey(event: any) {
        return event.shiftKey;
    }

    static toggleSelection(event: any, item: any, allItems: any[], selectedItems: any[]) {

        function isSelectionEmpty() {
            return selectedItems.length === 0;
        }

        function selectionContains(item: any) {
            return selectedItems.indexOf(item) !== -1;
        }

        function removeFromSelection(item: any) {
            var index = selectedItems.indexOf(item);
            selectedItems.splice(index, 1);
        }

        function addToSelection(item: any) {
            if (!selectionContains(item)) {
                selectedItems.push(item);
            }
        }

        function setSelection(item: any) {
            selectedItems.length = 0;
            selectedItems.push(item);
        }

        if (this.isCtrlKey(event)) {
            if (selectionContains(item)) {
                removeFromSelection(item);
            } else {
                addToSelection(item);
            }
        } else if (this.isShiftKey(event)) {
            if (!isSelectionEmpty()) {

                var lastSelectedItem = selectedItems[selectedItems.length - 1];
                var indexOfLastSelection = allItems.indexOf(lastSelectedItem);
                var indexOfNewSelection = allItems.indexOf(item);
                var from: number, to: number;
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
    }
}