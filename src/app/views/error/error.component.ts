import {Component} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";
import {Observable} from "rxjs";

@Component({
  selector: 'ch-error',
  templateUrl: './error.html'
})
export class ErrorComponent {
  error: Observable<string>;

  constructor(
    private route: ActivatedRoute) {}

  ngOnInit() {
    this.error = this.route.params.map((params: Params) => params['error']);
  }
}
