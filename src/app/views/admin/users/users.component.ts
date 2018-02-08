import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {ConfigService} from "../../../shared/services/config.service";
import {RestErrorService} from "../../../core/errorhandler/rest-error.service";
import {AuthHttpClientService} from "../../../shared/services/auth-http-client.service";

@Component({
  selector: 'ch-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.less'],
  encapsulation: ViewEncapsulation.Emulated
})
export class UsersComponent implements OnInit {

  users: string[];

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private authHttpClient: AuthHttpClientService,
  ) { }

  ngOnInit() {

    this.users = [];

    let sessionDbUrl;

    this.configService.getSessionDbUrl()
      .do(url => sessionDbUrl = url)
      .flatMap(url => this.authHttpClient.getAuth(url + '/users'))
      .subscribe((users: string[]) => {
        this.users = users;
      }, err => this.restErrorService.handleError(err, 'get users failed'));
  }
}
