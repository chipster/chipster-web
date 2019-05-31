import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AuthenticationService } from "./authentication-service";
import { OidcService } from "./oidc.service";
import { TokenService } from "./token.service";

@NgModule({
  imports: [CommonModule],
  providers: [AuthenticationService, TokenService, OidcService]
})
export class AuthenticationModule {}
