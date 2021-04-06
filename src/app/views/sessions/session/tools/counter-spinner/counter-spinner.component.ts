import { Component, Input, OnChanges } from "@angular/core";

@Component({
  selector: "ch-counter-spinner",
  templateUrl: "./counter-spinner.component.html",
  styleUrls: ["./counter-spinner.component.less"],
})
export class CounterSpinnerComponent implements OnChanges {
  @Input() count: number;

  offsetRight = 12;
  offsetTop = 5;
  fontSize = 17;

  constructor() {}

  ngOnChanges() {
    if (this.count.toString().length === 2) {
      this.offsetRight = 7;
      this.offsetTop = 5;
      this.fontSize = 17;
    } else if (this.count.toString().length > 2) {
      this.offsetRight = 8;
      this.offsetTop = 10;
      this.fontSize = 10;
    } else {
      this.offsetRight = 12;
      this.offsetTop = 5;
      this.fontSize = 17;
    }
  }
}
