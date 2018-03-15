import { Injectable }     from '@angular/core';
import {CanActivate, Router}    from '@angular/router';
import {TokenService} from "./token.service";

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private tokenService: TokenService,
    private router: Router) {
  }
  canActivate() {    
    return this.tokenService.checkInsecureToken()
      .map(() => {
        if (this.tokenService.getToken()) {
          return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      });
  }
}
