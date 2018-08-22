import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {ConfigService} from "../../../shared/services/config.service";
import {RestErrorService} from "../../../core/errorhandler/rest-error.service";
import {AuthHttpClientService} from "../../../shared/services/auth-http-client.service";
import { AuthenticationService } from '../../../core/authentication/authenticationservice';
import { User } from 'chipster-js-common';

@Component({
  selector: 'ch-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.less'],
  encapsulation: ViewEncapsulation.Emulated
})
export class UsersComponent implements OnInit {

  users: User[];

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private authHttpClient: AuthHttpClientService,
    private authenticationService: AuthenticationService) { }

  ngOnInit() {

    this.users = [];

    this.authenticationService.getUsers()
      .subscribe((users: User[]) => {
        this.users = users;
      }, err => this.restErrorService.handleError(err, 'get users failed'));
  }
}
