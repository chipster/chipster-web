import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Service } from 'chipster-js-common';
import { EMPTY, forkJoin, from } from 'rxjs';
import { catchError, filter, flatMap, tap } from 'rxjs/operators';
import { TokenService } from '../../../core/authentication/token.service';
import { RestErrorService } from '../../../core/errorhandler/rest-error.service';
import { AuthHttpClientService } from '../../../shared/services/auth-http-client.service';
import { ConfigService } from '../../../shared/services/config.service';


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

    this.configService.getInternalServices(this.tokenService.getToken()).pipe(
      flatMap(conf => {
        // sort by role
        this.services = conf.sort((a, b) => a.role.localeCompare(b.role));
        return from(this.services);
      }))
      // skip services without adminUri
      .pipe
      (filter(service => service.adminUri != null),
        (flatMap(service => {
          const requests = [];
          requests.push(this.auhtHttpClient.get(service.adminUri + '/admin/alive').pipe(
            tap(() => this.aliveMap.set(service.serviceId, 'OK'))),
            catchError(err => {
              console.log('alive check error', service.role, err);
              this.aliveMap.set(service.role, err.status);
              return EMPTY;
            }));

          requests.push(this.auhtHttpClient.getAuth(service.adminUri + '/admin/status')
            .pipe(tap(stats => {
              this.statusMap.set(service.role, stats);
            }),
              catchError(err => {
                console.log('get status error', service.role, err, err.status);
                this.statusMap.set(service.role, err.status);
                return EMPTY;
              })));
          return forkJoin(requests);
        })))
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
