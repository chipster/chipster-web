import { NgModule } from "@angular/core";
import { AuthenticationService } from "./authentication-service";
import { OidcService } from "./oidc.service";
import { TokenService } from "./token.service";

@NgModule({
  providers: [AuthenticationService, TokenService, OidcService],
})
export class AuthenticationModule {}
