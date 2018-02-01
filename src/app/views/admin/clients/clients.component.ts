import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {ConfigService} from "../../../shared/services/config.service";
import {RestErrorService} from "../../../core/errorhandler/rest-error.service";
import {AuthHttpClientService} from "../../../shared/services/auth-http-client.service";
import * as _ from "lodash";

@Component({
  selector: 'ch-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.less'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ClientsComponent implements OnInit {

  users: any[];

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private auhtHttpClient: AuthHttpClientService,
  ) { }

  ngOnInit() {
    this.configService.getService('session-db')
      .flatMap(service => {
        return this.auhtHttpClient.getAuth(service.adminUri + '/admin/topics');
      })
      .subscribe((topics: any[]) => {

        this.users = [];

        // filter out server topics and get values as an array
        let sessionIds = Object.keys(topics)
          .filter(topicName => topicName !== 'jobs' && topicName !== 'files');
        let sessionTopics = sessionIds.map(id => topics[id]);

        sessionTopics.forEach(topic => {
          topic.forEach(user => {
            let userCopy = _.clone(user);
            // clean up the user ip address
            let ip = userCopy.address;
            // why there is a slash in the beginning?
            if (ip.startsWith('/')) {
              ip = ip.slice(1);
            }
            // the port isn't interesting
            if (ip.indexOf(':') !== -1) {
              ip = ip.slice(0, ip.indexOf(':'));
            }
            userCopy.address = ip;
            this.users.push(userCopy);
          });
        });
      }, err => this.restErrorService.handleError(err, 'get clients failed'));
  }
}

