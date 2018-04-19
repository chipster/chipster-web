import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { TokenService } from './token.service';
import { AuthenticationService } from './authenticationservice';
import { Observable } from 'rxjs/Observable';
import { User } from '../../model/user';
import { TermsComponent } from '../../views/terms/terms.component';
import { ConfigService } from '../../shared/services/config.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private tokenService: TokenService,
    private router: Router,
    private authenticationService: AuthenticationService,
    private configService: ConfigService) {
  }

  canActivate(): Observable<boolean> {

    if (this.tokenService.getToken()) {

      const observables = [
        this.authenticationService.getUser(),
        this.configService.getTermsOfUseAuths(),
        this.configService.getTermsOfUseVersion()
      ];

      return Observable.forkJoin(observables)
        .map(res => {
          const user = res[0];
          const askForAuths = res[1];
          const latestVersion = res[2];

          // is approval required for this authenticator
          const approvalRequired = askForAuths.indexOf(user.auth) !== -1;
          // has user already approved the terms of use
          const approved = user.termsVersion >= latestVersion && user.termsAccepted != null;

          if (!approvalRequired) {
            return true;
          } else if (approved) {
            console.log('terms of use accepted already');
            return true;
          } else {
            console.log('terms of use must be accepted first',
              ', required for this auth:', approvalRequired,
              ', accpeted version:', user.termVersion,
              ', latest version:', latestVersion,
              ', accepted timestamp:', user.termsAccepted);
            this.router.navigate(['/terms']);
            return false;
          }
        });
    } else {
      this.router.navigate(['/login']);
      return Observable.of(false);
    }
  }
}
