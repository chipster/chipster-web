import { Component, OnInit, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { User } from "chipster-js-common";
import { filter, mergeMap } from "rxjs/operators";
import { AuthenticationService } from "../../core/authentication/authentication-service";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { ConfigService } from "../../shared/services/config.service";
import { RouteService } from "../../shared/services/route.service";
import { ManualComponent } from "../manual/manual.component";

@Component({
  selector: "ch-terms",
  templateUrl: "./terms.component.html",
  styleUrls: ["./terms.component.less"],
  imports: [ManualComponent],
})
export class TermsComponent implements OnInit {
  private authenticationService = inject(AuthenticationService);
  private restErrorService = inject(RestErrorService);
  private configService = inject(ConfigService);
  private routeService = inject(RouteService);
  private route = inject(ActivatedRoute);

  // increase by one to force everyone to accept again
  static latestTermsVersion = 1;
  readonly termsOfUse = signal<string>(undefined);
  readonly showAccept = signal(false);

  ngOnInit() {
    this.configService.get(ConfigService.KEY_TERMS_OF_USE_PATH).subscribe({
      next: (path) => {
        this.termsOfUse.set(path);
      },
      error: (err) => this.restErrorService.showError("failed to get the configuration", err),
    });

    this.route.queryParams
      .pipe(
        filter((params) => {
          console.log(params);
          return params["showAccept"];
        }),
      )
      .subscribe((params) => {
        this.showAccept.set(!!params.showAccept);
        console.log(this.showAccept());
      });
  }

  accept() {
    let latestVersion;

    this.configService
      .get(ConfigService.KEY_TERMS_OF_USE_VERSION)
      .pipe(
        mergeMap((v) => {
          latestVersion = v;
          return this.authenticationService.getUser();
        }),
        mergeMap((user: User) => {
          user.termsVersion = latestVersion;
          user.termsAccepted = new Date().toISOString();
          return this.authenticationService.updateUser(user);
        }),
      )
      .subscribe({
        next: () => {
          this.routeService.navigateAbsolute("/sessions");
        },
        error: (err) => this.restErrorService.showError("updating the user object failed", err),
      });
  }
}
