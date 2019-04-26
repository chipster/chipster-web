import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Service } from "chipster-js-common";
import { map, mergeMap } from "rxjs/operators";
import { TokenService } from "../../../core/authentication/token.service";
import { RestErrorService } from "../../../core/errorhandler/rest-error.service";
import { AuthHttpClientService } from "../../../shared/services/auth-http-client.service";
import { ConfigService } from "../../../shared/services/config.service";

@Component({
  selector: "ch-services",
  templateUrl: "./maintenance.component.html",
  styleUrls: ["./maintenance.component.less"],
  encapsulation: ViewEncapsulation.Emulated
})
export class MaintenanceComponent implements OnInit {
  constructor(
    private configService: ConfigService,
    private restErrorService: RestErrorService,
    private auhtHttpClient: AuthHttpClientService,
    private tokenService: TokenService
  ) {}

  ngOnInit() {}

  backupNow(role: string) {
    if (role === "file-broker") {
      // storage backups are made directly at file-broker
      this.backup("file-broker", "/admin/backup");
    } else {
      // the backup service takes care of db backups
      this.backup("backup", "/admin/backup/" + role);
    }
  }

  backup(backupService: string, path: string) {
    this.configService
      .getInternalServices(this.tokenService.getToken())
      .pipe(
        map((services: Service[]) => {
          services = services.filter(s => s.role === backupService);
          return services[0];
        }),
        mergeMap((service: Service) => {
          return this.auhtHttpClient.postAuth(service.adminUri + path, null);
        })
      )
      .subscribe(null, err =>
        this.restErrorService.showError("backup start failed", err)
      );
  }
}
