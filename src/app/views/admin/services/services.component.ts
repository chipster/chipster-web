import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ConfigService} from '../../../shared/services/config.service';
import {Observable} from 'rxjs/Observable';
import {RestErrorService} from '../../../core/errorhandler/rest-error.service';
import {AuthHttpClientService} from '../../../shared/services/auth-http-client.service';
import {Service} from 'chipster-js-common';
import { TokenService } from '../../../core/authentication/token.service';

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
    private tokenService: TokenService,
  ) { }

  ngOnInit() {
    this.services = [];
    this.aliveMap = new Map();
    this.statusMap = new Map();

    this.configService.getInternalServices(this.tokenService.getToken())
      .flatMap(conf => {
        // sort by role
        this.services = conf.sort((a, b) => a.role.localeCompare(b.role));
        return Observable.from(this.services);
      })
      // skip services without adminUri
      .filter(service => service.adminUri != null)
      .flatMap(service => {
        const requests = [];
        requests.push(this.auhtHttpClient.get(service.adminUri + '/admin/alive')
          .do(() => this.aliveMap.set(service.serviceId, 'OK'))
          .catch(err => {
             console.log('alive check error', service.role, err);
             this.aliveMap.set(service.role, err.status);
             return Observable.empty();
            }));

        requests.push(this.auhtHttpClient.getAuth(service.adminUri + '/admin/status')
          .do(stats => {
            this.statusMap.set(service.role, stats);
          })
          .catch(err => {
            console.log('get status error', service.role, err, err.status);
            this.statusMap.set(service.role, err.status);
            return Observable.empty();
          }));
        return Observable.forkJoin(requests);
      })
      .subscribe(null, err => this.restErrorService.showError('get services failed', err));
  }

  getStatusCount(service) {
    return Object.keys(this.getStatus(service)).length;
  }

  getStatusString(service) {
    if (service) {
      const statusObj = this.getStatus(service);
      if (statusObj) {
        // 2 for pretty
        return JSON.stringify(statusObj, null, 2);
      }
    }
    return '';
  }

  getStatus(service) {
    return this.statusMap.get(service.role);
  }
}
