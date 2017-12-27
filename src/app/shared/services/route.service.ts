import {Router} from "@angular/router";
import {Injectable} from "@angular/core";

@Injectable()
export class RouteService {

  constructor(private router: Router) {}

  redirectToLoginAndBack() {
    this.router.navigate(['/login'], {queryParams: {returnUrl: this.router.routerState.snapshot.url}});
  }

}
