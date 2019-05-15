import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Service } from "chipster-js-common";
import { mergeMap } from "rxjs/operators";
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
      .getInternalService(backupService, this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => {
          return this.auhtHttpClient.postAuth(service.adminUri + path, null);
        })
      )
      .subscribe(null, err =>
        this.restErrorService.showError("backup start failed", err)
      );
  }

  deleteOldOrphanFiles() {
    this.configService
      .getInternalService("file-broker", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => {
          return this.auhtHttpClient.postAuth(
            service.adminUri + "/admin/delete-orphans",
            null
          );
        })
      )
      .subscribe(null, err =>
        this.restErrorService.showError("delete orphans failed", err)
      );
  }

  storageCheck() {
    this.configService
      .getInternalService("file-broker", this.tokenService.getToken())
      .pipe(
        mergeMap((service: Service) => {
          return this.auhtHttpClient.postAuth(
            service.adminUri + "/admin/check",
            null
          );
        })
      )
      .subscribe(null, err =>
        this.restErrorService.showError("storage check failed", err)
      );
  }
}
