import { Component, OnInit, ChangeDetectionStrategy, inject } from "@angular/core";
import { OidcService } from "../../core/authentication/oidc.service";

@Component({
  selector: "ch-oidc-callback",
  templateUrl: "./oidc-callback.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class OidcCallbackComponent implements OnInit {
  private oidcService = inject(OidcService);

  ngOnInit() {
    this.oidcService.completeAuthentication();
  }
}
