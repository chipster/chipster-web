import {Component} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Observable} from "rxjs";

@Component({
  selector: 'ch-error',
  templateUrl: './error.html'
})
export class ErrorComponent {
  msg: Observable<string>;

  constructor(
    private route: ActivatedRoute,
    private router: Router) {}

  ngOnInit() {
    this.msg = this.route.params.map((params: Params) => params['msg']);
  }

  closeAlert() {
    this.router.navigate([{ outlets: { header: null}}]);
  }
}
