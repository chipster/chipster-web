import { NgModule } from "@angular/core";
import { AuthenticationModule } from "./authentication/authentication.module";
import { RestErrorService } from "./errorhandler/rest-error.service";

/*
 * @description: Core module should contain the most vital and low level parts of application
 */

@NgModule({
  imports: [AuthenticationModule],
  providers: [RestErrorService],
})
export class CoreModule {}
