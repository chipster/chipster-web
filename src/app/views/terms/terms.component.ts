import { AuthenticationService } from "../../core/authentication/authentication-service";
import { Component, OnInit } from "@angular/core";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { ConfigService } from "../../shared/services/config.service";
import { User } from "chipster-js-common";
import { RouteService } from "../../shared/services/route.service";
import { ErrorService } from "../../core/errorhandler/error.service";

@Component({
  selector: "ch-terms",
  templateUrl: "./terms.component.html",
  styleUrls: ["./terms.component.less"]
})
export class TermsComponent implements OnInit {
  // increase by one to force everyone to accept again
  static latestTermsVersion = 1;
  public termsOfUse: string;

  constructor(
    private authenticationService: AuthenticationService,
    private restErrorService: RestErrorService,
    private configService: ConfigService,
    private routeService: RouteService,
  ) {}

  ngOnInit() {
    this.configService.get(ConfigService.KEY_TERMS_OF_USE_PATH).subscribe(
      path => {
        this.termsOfUse = path;
      },
      err =>
        this.restErrorService.showError(
          "failed to get the configuration",
          err
        )
    );
  }

  accept() {
    let latestVersion;

    this.configService
      .get(ConfigService.KEY_TERMS_OF_USE_VERSION)
      .flatMap(v => {
        latestVersion = v;
        return this.authenticationService.getUser();
      })
      .flatMap((user: User) => {
        user.termsVersion = latestVersion;
        user.termsAccepted = new Date().toISOString();
        return this.authenticationService.updateUser(user);
      })
      .subscribe(
        () => {
          this.routeService.navigateAbsolute("/sessions");
        },
        err =>
          this.restErrorService.showError(
            "updating the user object failed",
            err
          )
      );
  }
}
