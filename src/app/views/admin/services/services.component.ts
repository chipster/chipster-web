import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ConfigService} from "../../../shared/services/config.service";
import {Observable} from "rxjs/Observable";
import {RestErrorService} from "../../../core/errorhandler/rest-error.service";
import {AuthHttpClientService} from "../../../shared/services/auth-http-client.service";
import {Service} from "../../../model/service";

@Component({
  selector: 'ch-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.less'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ServicesComponent implements OnInit {

  services: Service[];
  aliveMap: Map<string, string>;
  private statusMap: Map<string, Object>;

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private auhtHttpClient: AuthHttpClientService,
  ) { }

  ngOnInit() {
    this.services = [];
    this.aliveMap = new Map();
    this.statusMap = new Map();

    this.configService.getFullConfiguration()
      .flatMap(conf => {
        // sort by role
        this.services = conf.sort((a, b) => a.role.localeCompare(b.role));
        return Observable.from(this.services);
      })
      // skip services without adminUri
      .filter(service => service.adminUri != null)
      .flatMap(service => {
        let requests = [];
        requests.push(this.auhtHttpClient.get(service.adminUri + '/admin/alive')
          .do(() => this.aliveMap.set(service.serviceId, 'OK'))
          .catch(err => {
             console.log('alive check error', service.role, err);
             this.aliveMap.set(service.serviceId, err.status);
             return Observable.empty();
            }));

        requests.push(this.auhtHttpClient.getAuth(service.adminUri + '/admin/status')
          .do(stats => {
            this.statusMap.set(service.serviceId, stats)
          })
          .catch(err => {
            console.log('get status error', service.role, err, err.status);
            this.statusMap.set(service.serviceId, err.status);
            return Observable.empty();
          }));
        return Observable.forkJoin(requests);
      })
      .subscribe(null, err => this.restErrorService.handleError(err, 'get services failed'));
  }

  getStatusCount(service) {
    return Object.keys(this.getStatus(service)).length;
  }

  getStatusString(service) {
    if (service) {
      let statusObj = this.getStatus(service);
      if (statusObj) {
        // 2 for pretty
        return JSON.stringify(statusObj, null, 2);
      }
    }
    return '';
  }

  getStatus(service) {
    return this.statusMap.get(service.serviceId);
  }
}
