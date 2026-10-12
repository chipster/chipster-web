import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "bytes" })
export class BytesPipe implements PipeTransform {
  /*
   * Round up to show a value that is never below the real size, for example
   * next to a limit that the size exceeds.
   */
  transform(bytes: string | number, precision: number = 1, roundUp = false) {
    if (isNaN(parseFloat(<string>bytes)) || !isFinite(<number>bytes)) {
      return "-";
    }
    if (bytes === 0) {
      return "0 bytes";
    }
    if (<number>bytes < 0) {
      // log not defined for negative values
      return bytes;
    }

    // for example, let's convert number 340764 to precision 0
    // we can calculate base 1k logarithm using any other log function
    const log1k = Math.log(<number>bytes) / Math.log(1024); // 1.837...
    let exponent = Math.floor(log1k); // 1
    const units = ["bytes", "kB", "MB", "GB", "TB", "PB"];
    const factor = 10 ** precision;
    const round = (value: number) => (roundUp ? Math.ceil(value * factor) : Math.round(value * factor)) / factor;

    let scaled = round(<number>bytes / 1024 ** exponent); // 332.77... -> 333
    // rounding may reach the next unit, for example 1023.99 kB -> 1024.0 kB -> 1.0 MB
    if (scaled >= 1024 && exponent < units.length - 1) {
      exponent++;
      scaled = round(<number>bytes / 1024 ** exponent);
    }

    return scaled.toFixed(precision) + " " + units[exponent];
  }
}
