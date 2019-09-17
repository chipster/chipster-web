import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "localDate"
})
export class LocalDatePipe implements PipeTransform {
  transform(date: any): string {
    if (date === null || date === undefined) {
      return "";
    }

    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
      if (!(d instanceof Date)) {
        return "";
      }
    }
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  }
}
