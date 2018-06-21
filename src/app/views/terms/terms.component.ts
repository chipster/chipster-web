import {AuthenticationService} from '../../core/authentication/authenticationservice';
import {Component, OnInit, ViewChild} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {RestErrorService} from '../../core/errorhandler/rest-error.service';
import {HttpErrorResponse} from '@angular/common/http';
import {ConfigService} from '../../shared/services/config.service';
import { AuthGuard } from '../../core/authentication/auth-guard.service';
import { User } from '../../model/user';
import { flatMap } from 'rxjs/operators';
import { RouteService } from '../../shared/services/route.service';

@Component({
  selector: 'ch-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.less']
})
export class TermsComponent implements OnInit {

  // increase by one to force everyone to accept again
  static latestTermsVersion = 1;
  public termsOfUse: string;

  constructor(private router: Router,
    private authenticationService: AuthenticationService,
    private restErrorService: RestErrorService,
    private configService: ConfigService,
    private routeService: RouteService) {
  }

  ngOnInit() {
    this.configService.get(ConfigService.KEY_TERMS_OF_USE_PATH)
      .subscribe(path => {
        this.termsOfUse = path;
      }, err => this.restErrorService.handleError(err, 'failed to get the configuration'));
  }

  accept() {

    let latestVersion;

    this.configService.get(ConfigService.KEY_TERMS_OF_USE_VERSION)
      .flatMap(v => {
        latestVersion = v;
        return this.authenticationService.getUser();
      })
      .flatMap((user: User) => {
        user.termsVersion = latestVersion;
        user.termsAccepted = new Date().toISOString();
        return this.authenticationService.updateUser(user);
      })
      .subscribe(() => {
        this.routeService.navigateAbsolute('/sessions');
      }, err => this.restErrorService.handleError(err, 'updating the user object failed'));
  }
}