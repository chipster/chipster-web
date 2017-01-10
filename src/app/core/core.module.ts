import {NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import {AuthenticationModule} from "./authentication/authentication.module";
import {ErrorHandlerService} from "./errorhandler/error-handler.service";
import {RestServicesModule} from "./rest-services/rest-services.module";

@NgModule({
  imports: [
    CommonModule,
    AuthenticationModule,
    RestServicesModule
  ],
  declarations: [],
  providers: [ErrorHandlerService]
})
export class CoreModule { }
