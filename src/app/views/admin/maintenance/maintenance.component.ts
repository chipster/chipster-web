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

  backupNowDb() {
    this.backup("session-db");
    this.backup("auth");
    this.backup("job-history");
  }

  backupNowStorage() {
    this.backup("file-broker");
  }

  backup(role: string) {
    this.configService
      .getInternalServices(this.tokenService.getToken())
      .pipe(
        map((services: Service[]) => {
          return services.filter(s => s.role === role)[0];
        }),
        mergeMap((service: Service) =>
          this.auhtHttpClient.postAuth(service.adminUri + "/admin/backup", null)
        )
      )
      .subscribe(null, err =>
        this.restErrorService.showError("get services failed", err)
      );
  }
}
