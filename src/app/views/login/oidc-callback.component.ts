import { Component, OnInit } from "@angular/core";
import { OidcService } from "../../core/authentication/oidc.service";

@Component({
  selector: "ch-oidc-callback",
  templateUrl: "./oidc-callback.component.html",
})
export class OidcCallbackComponent implements OnInit {
  constructor(private oidcService: OidcService) {}

  ngOnInit() {
    this.oidcService.completeAuthentication();
  }
}
