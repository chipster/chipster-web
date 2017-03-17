import {Component} from "@angular/core";
import {ErrorService} from "./error.service";
import {ErrorMessage} from "./errormessage";

@Component({
  selector: 'ch-error',
  templateUrl: './error.html'
})
export class ErrorComponent {
  msg: string;
  dismissible: boolean;

  constructor(
    private errorService: ErrorService) {}

  ngOnInit() {
    this.errorService.getErrors().subscribe((error: ErrorMessage) => {
      if (error) {
        this.msg = error.msg;
        this.dismissible = error.dismissible;
      } else {
        this.closeAlert();
      }
    });
  }

  closeAlert() {
    this.msg = null;
  }
}
