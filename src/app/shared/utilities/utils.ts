import { Dataset } from "chipster-js-common";
import { every, includes } from "lodash-es";
import log from "loglevel";

export default class UtilsService {
  static getFileExtension(name: string) {
    return name.split(".").pop();
  }

  static startsWith(data: string, start: string) {
    return data.startsWith(start);
  }

  static mapValues(map: Map<any, any>) {
    const array: any[] = [];
    map.forEach((value: any) => {
      array.push(value);
    });
    return array;
  }

  static arrayToMap<T>(array: T[], key: string) {
    const map = new Map<string, T>();
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
      return selectedItems.includes(item);
    }

    function removeFromSelection(item: any) {
      const index = selectedItems.indexOf(item);
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
        const lastSelectedItem = selectedItems[selectedItems.length - 1];
        const indexOfLastSelection = allItems.indexOf(lastSelectedItem);
        const indexOfNewSelection = allItems.indexOf(item);
        let from: number;
        let to: number;
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

  static getDatasetIds(datasets: Array<Dataset>): Array<string> {
    return datasets.map((dataset: Dataset) => dataset.datasetId);
  }

  /**
   * Check that two given arrays contain same strings. Given parameter-arrays must be of equal length
   */
  static equalStringArrays(first: Array<string>, second: Array<string>) {
    return every(first, (item) => includes(second, item));
  }

  static compareStringNullSafe(a, b): number {
    if (a) {
      return a.localeCompare(b);
    }
    if (b) {
      return -b.localeCompare(a);
    }
    return 0;
  }

  static parseISOStringToDate(s: any) {
    if (s != null) {
      return new Date(Date.parse(s));
    }
    return null;
  }

  static millisecondsBetweenDates(start: Date, end: Date) {
    return end.getTime() - start.getTime();
  }

  static millisecondsToHumanFriendly(milliseconds: number, zero = "0", lessThanSecond = "less than second"): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // Remainders. For example, when the "minutes" is 74, the "minute" is "14").
    // Now we show only the most significant unit (e.g. "1 hour") where the both values are equal.
    // Let's keep these anyway, in case we want to show more precision at some point,
    // e.g. "1 hour 14 minutes".

    const millisecond = milliseconds % 1000;
    const second = seconds % 60;
    const minute = minutes % 60;
    const hour = hours % 24;

    if (days == 1) {
      return "a day";
    }

    if (days > 1) {
      return days + " days";
    }

    if (hour == 1) {
      return "an hour";
    }

    if (hour > 1) {
      return hour + " hours";
    }

    if (minute == 1) {
      return "a minute";
    }

    if (minute > 1) {
      return minute + " minutes";
    }

    if (second == 1) {
      return "a second";
    }

    if (second > 0) {
      return seconds + " seconds";
    }

    if (millisecond > 0) {
      return lessThanSecond;
    }

    if (millisecond == 0) {
      return zero;
    }

    log.warn("unknown millisecond time " + milliseconds);
    return "" + milliseconds;
  }

  static getCommonPrefix(array: String[]) {
    const A = array.concat().sort();
    const a1 = A[0];
    const a2 = A[A.length - 1];
    const L = a1.length;
    let i = 0;
    while (i < L && a1.charAt(i) === a2.charAt(i)) i++;
    return a1.substring(0, i);
  }

  static partitionArray<Type>(array: Type[], fn): [Type[], Type[]] {
    const passed: Type[] = [];
    const rejected: Type[] = [];
    array.forEach((x) => (fn(x) ? passed : rejected).push(x));
    return [passed, rejected];
  }

  static getCountAndUnit(count: number, unit: string) {
    return count === 1 ? count + " " + unit : count + " " + unit + "s";
  }

  static onlyHasUniqueValues(array: Array<any>) {
    return new Set(array).size === array.length;
  }

  static sIfMany(array: any[]): string {
    return array.length > 1 ? "s" : "";
  }

  static stringToDateKeepNull(s: string): Date | null {
    if (s) {
      return new Date(s);
    }
    return null;
  }

  /**
   * Render date to YYYY-MM-DD hh:mm:ss
   */
  static renderDate(date: Date): string {
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Note: Months are zero-based
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    return date;
  }
}
