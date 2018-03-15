import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {ConfigService} from "../../../shared/services/config.service";
import {RestErrorService} from "../../../core/errorhandler/rest-error.service";
import {AuthHttpClientService} from "../../../shared/services/auth-http-client.service";
import {Observable} from "rxjs/Observable";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'ch-storage',
  templateUrl: './storage.component.html',
  styleUrls: ['./storage.component.less'],
  encapsulation: ViewEncapsulation.Emulated
})
export class StorageComponent implements OnInit {

  users: string[];
  quotas: Map<string, any>;

  selectedUser: string;
  sessions: any[];

  @ViewChild('modalContent') modalContent: any;

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private authHttpClient: AuthHttpClientService,
    private modalService: NgbModal,
  ) { }

  ngOnInit() {

    this.users = [];
    this.quotas = new Map();

    let sessionDbUrl;

    this.configService.getSessionDbUrl()
      .do(url => sessionDbUrl = url)
      .flatMap(() => this.authHttpClient.getAuth(sessionDbUrl + '/users'))
      .do((users: string[]) => this.users = users)
      .flatMap((users: string[]) => Observable.from(users))
      .flatMap(user => {
          return this.authHttpClient.getAuth(sessionDbUrl + '/users/' + encodeURIComponent(user) + '/quota');
      })
      .do((quota: any) => this.quotas.set(quota.username, quota))
      .subscribe(null, err => this.restErrorService.handleError(err, 'get quotas failed'));
  }

  selectUser(user: string) {

    this.modalService.open(this.modalContent, {size: 'lg'});

    this.selectedUser = user;
    this.sessions = [];

    this.configService.getSessionDbUrl()
      .flatMap(url => this.authHttpClient.getAuth(url + '/users/' + user + '/sessions'))
      .subscribe((sessions: any[]) => {
        this.sessions = sessions;
      }, err => this.restErrorService.handleError(err, 'get quotas failed'));
  }
}
