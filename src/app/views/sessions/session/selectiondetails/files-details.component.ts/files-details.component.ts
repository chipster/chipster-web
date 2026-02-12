import { Component, Input } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { LocalDatePipe } from "../../../../../shared/pipes/local-date.pipe";
import { BytesPipe } from "../../../../../shared/pipes/bytes.pipe";

@Component({
  selector: "ch-files-details",
  templateUrl: "./files-details.component.html",
  styleUrls: ["./files-details.component.less"],
  imports: [LocalDatePipe, BytesPipe],
})
export class FilesDetailsComponent {
  @Input()
  datasets: Dataset[];
  @Input()
  showDate: boolean = true;
}
