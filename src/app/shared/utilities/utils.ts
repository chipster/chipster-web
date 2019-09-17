import { Dataset } from "chipster-js-common";
import * as _ from "lodash";

export default class UtilsService {
  static getFileExtension(name: string) {
    return name.split(".").pop();
  }

  static startsWith(data: string, start: string) {
    return data.substring(0, start.length) === start;
  }

  static mapValues(map: Map<any, any>) {
    let array: any[] = [];
    map.forEach(function(value: any) {
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

  static toggleSelection(
    event: any,
    item: any,
    allItems: any[],
    selectedItems: any[]
  ) {
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
    return _.every(first, item => {
      return _.includes(second, item);
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

  static parseISOStringToDate(s: any) {
    var b = s.split(/\D+/);
    return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
  }

  static convertMS(milliseconds: any) {
    let day, hour, minute, seconds;
    seconds = Math.floor(milliseconds / 1000);
    minute = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hour = Math.floor(minute / 60);
    minute = minute % 60;
    day = Math.floor(hour / 24);
    hour = hour % 24;
    let duration = "";
    if (day > 0) {
      duration += day + "d :";
    }
    if (hour > 0) {
      duration += hour + "h :";
    }
    if (minute > 0) {
      duration += minute + "m :";
    }
    if (seconds > 0) {
      duration += seconds + "s ";
    }
    return duration;
  }
}
