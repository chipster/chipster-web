import {Component} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {TokenService} from "../../core/authentication/token.service";
import { AuthenticationService } from "../../core/authentication/authenticationservice";

@Component({
  selector: 'ch-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent {

  username$: Observable<string>;

  constructor(
    private tokenService: TokenService,
    private authenticationService: AuthenticationService) {
    this.username$ = authenticationService.getUsersDisplayName$();
  }

  isLoggedIn() {
    return this.tokenService.isLoggedIn();
  }

  tokenHasExpired() {
    return this.tokenService.tokenHasExpired();
  }

}
