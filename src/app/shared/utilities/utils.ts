import { Dataset } from "chipster-js-common";
import * as _ from "lodash";

export default class UtilsService {

  static getFileExtension(name: string) {
    return name.split('.').pop();
  }

  static startsWith(data: string, start: string) {
    return data.substring(0, start.length) === start;
  }

  static mapValues(map: Map<any, any>) {
    let array: any[] = [];
    map.forEach(function (value: any) {
      array.push(value);
    });
    return array;
  }

  static arrayToMap<T>(array: T[], key: string) {
    let map = new Map<string, T>();
    for (let i = 0; i < array.length; i++) {
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
      let index = selectedItems.indexOf(item);
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

        let lastSelectedItem = selectedItems[selectedItems.length - 1];
        let indexOfLastSelection = allItems.indexOf(lastSelectedItem);
        let indexOfNewSelection = allItems.indexOf(item);
        let from: number, to: number;
        if (indexOfLastSelection < indexOfNewSelection) {
          from = indexOfLastSelection + 1;
          to = indexOfNewSelection + 1;
        } else {
          from = indexOfNewSelection;
          to = indexOfLastSelection;
        }

        for (let i = from; i < to; i++) {
          addToSelection(allItems[i]);
        }

      } else {
        setSelection(item);
      }

    } else {
      setSelection(item);
    }
  }

  static getDatasetIds(datasets: Array<Dataset>): Array<String> {
    return datasets.map((dataset: Dataset) => dataset.datasetId);
  }

  /**
   * Check that two given arrays contain same strings. Given parameter-arrays must be of equal length
   */
  static equalStringArrays(first: Array<String>, second: Array<String>) {
    return _.every(first, (item) => {
      return _.includes(second, item)
    });
  }

  static compareStringNullSafe(a, b): number {
    if (a) {
      return a.localeCompare(b);
    } else if (b) {
      return -b.localeCompare(a);
    } else {
      return 0;
    }
  }
}
