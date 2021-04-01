import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { User } from "chipster-js-common";
import { filter, flatMap } from "rxjs/operators";
import { AuthenticationService } from "../../core/authentication/authentication-service";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";

@Component({
  selector: "ch-terms",
  templateUrl: "./terms.component.html",
  styleUrls: ["./terms.component.less"]
})
export class TermsComponent implements OnInit {
  // increase by one to force everyone to accept again
  static latestTermsVersion = 1;
  termsOfUse: string;
  showAccept = false;

  constructor(
    private authenticationService: AuthenticationService,
    private restErrorService: RestErrorService,
    private configService: ConfigService,
    private routeService: RouteService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.configService.get(ConfigService.KEY_TERMS_OF_USE_PATH).subscribe(
      path => {
        this.termsOfUse = path;
      },
      err =>
        this.restErrorService.showError("failed to get the configuration", err)
    );

    this.route.queryParams.pipe(
      filter(params => {
        console.log(params);
        return params["showAccept"];
      }),
    )
    .subscribe(params => {
      this.showAccept = !!params.showAccept;
      console.log(this.showAccept);
    }
  );
  }

  accept() {
    let latestVersion;

    this.configService
      .get(ConfigService.KEY_TERMS_OF_USE_VERSION)
      .pipe(
        flatMap(v => {
          latestVersion = v;
          return this.authenticationService.getUser();
        }),
        flatMap((user: User) => {
          user.termsVersion = latestVersion;
          user.termsAccepted = new Date().toISOString();
          return this.authenticationService.updateUser(user);
        })
      )
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
