import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "bytes" })
export class BytesPipe implements PipeTransform {
  transform(bytes: string | number, precision: number = 1) {
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
    const exponent = Math.floor(log1k); // 1
    const units = ["bytes", "kB", "MB", "GB", "TB", "PB"];
    const unit = units[exponent]; // kB
    const scaled = <number>bytes / 1024 ** exponent; // 332.77...
    const rounded = scaled.toFixed(precision); // 333

    return rounded + " " + unit;
  }
}
