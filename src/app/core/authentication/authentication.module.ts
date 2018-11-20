import { NgModule } from "@angular/core";
import { AuthenticationService } from "./authentication-service";
import { CommonModule } from "@angular/common";
import { TokenService } from "./token.service";

@NgModule({
  imports: [CommonModule],
  providers: [AuthenticationService, TokenService]
})
export class AuthenticationModule {}
