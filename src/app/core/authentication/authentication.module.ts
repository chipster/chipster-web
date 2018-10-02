import { NgModule } from "@angular/core";
import { AuthenticationService } from "./authenticationservice";
import { CommonModule } from "@angular/common";
import { TokenService } from "./token.service";

import { AuthGuard } from "./auth-guard.service";
import { LandGuard } from "./land-guard.service";
import { AnalyzeGuard } from "./analyze-guard.service";

@NgModule({
  imports: [CommonModule],
  providers: [
    AuthenticationService,
    TokenService,
    AuthGuard,
    LandGuard,
    AnalyzeGuard
  ]
})
export class AuthenticationModule {}
