import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "secondspipe",
})
export class SecondsPipe implements PipeTransform {
  transform(seconds: number | string): any {
    if (Number.isNaN(parseFloat(<string>seconds)) || !Number.isFinite(<number>seconds)) {
      return "-";
    }
    if (seconds === 0) {
      return "";
    }
    const units = ["seconds", "minutes", "hours"];
    const number = Math.floor(Math.log(<number>seconds) / Math.log(60));
    return (<number>seconds / 60 ** Math.floor(number)).toFixed(0) + " " + units[number];
  }
}
