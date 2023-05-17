import { Component, Input } from "@angular/core";
import { Dataset } from "chipster-js-common";

@Component({
  selector: "ch-files-details",
  templateUrl: "./files-details.component.html",
  styleUrls: ["./files-details.component.less"],
})
export class FilesDetailsComponent {
  @Input()
  datasets: Dataset[];
  @Input()
  showDate: boolean = true;
}
