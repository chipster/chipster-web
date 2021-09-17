import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Service } from "chipster-js-common";
import log from "loglevel";
import { forkJoin, of } from "rxjs";
import { catchError, map, mergeMap, tap } from "rxjs/operators";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";

@Component({
  selector: "ch-services",
  templateUrl: "./services.component.html",
  styleUrls: ["./services.component.less"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ServicesComponent implements OnInit {
  services: Service[];
  aliveMap: Map<Service, string>;
  private statusMap: Map<string, Record<string, any>>;

  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private authHttpClient: AuthHttpClientService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.services = [];
    this.aliveMap = new Map();
    this.statusMap = new Map();

    this.configService
      .getInternalServices(this.tokenService.getToken())
      .pipe(
        tap((services: Service[]) => {
          // store all services, sort by role
          this.services = services.sort((a, b) => a.role.localeCompare(b.role));
        }),
        // filter out services without admin uri
        map((services: Service[]) => services.filter((service) => service.adminUri != null)),
        // create alive and status requests
        mergeMap((services) => {
          const aliveRequests = services.map((service: Service) =>
            this.authHttpClient.get(service.adminUri + "/admin/alive").pipe(
              tap(() => {
                this.aliveMap.set(service, "OK");
              }),
              catchError((err) => {
                log.warn("alive check failed", service.role, err);
                this.aliveMap.set(service, err.status);
                return of(false); // returning EMPTY would cancel others in forkJoin
              })
            )
          );

          const statusRequests = services.map((service: Service) =>
            this.authHttpClient.getAuth(service.adminUri + "/admin/status").pipe(
              tap((status) => {
                this.statusMap.set(service.role, status);
              }),
              catchError((err) => {
                log.warn("status check failed", service.role, err);
                this.statusMap.set(service.role, err.status);
                return of(false); // returning EMPTY would cancel others in forkJoin
              })
            )
          );

          return forkJoin(aliveRequests.concat(statusRequests));
        })
      )
      .subscribe({
        next: () => {
          log.info("get services data done");
        },
        error: (err) => {
          this.restErrorService.showError("get services data failed", err);
        },
      });
  }

  getStatusValuesCount(service): number {
    return Object.keys(this.getStatusObject(service)).length;
  }

  getStatusString(service): string {
    if (service) {
      const statusObj = this.getStatusObject(service);
      if (statusObj) {
        // 2 for pretty
        return JSON.stringify(statusObj, null, 2);
      }
    }
    return "";
  }

  private getStatusObject(service): Record<string, any> {
    return this.statusMap.get(service.role);
  }
}
