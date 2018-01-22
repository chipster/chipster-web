import {Component} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {TokenService} from "../../core/authentication/token.service";

@Component({
  selector: 'ch-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent {

  username$: Observable<string>;

  constructor(
    private tokenService: TokenService) {
    this.username$ = tokenService.getUsername$();
  }

  isLoggedIn() {
    return this.tokenService.isLoggedIn();
  }

  tokenHasExpired() {
    return this.tokenService.tokenHasExpired();
  }

}
