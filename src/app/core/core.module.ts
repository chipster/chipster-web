import {NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import {AuthenticationModule} from "./authentication/authentication.module";
import {ErrorHandlerService} from "./errorhandler/error-handler.service";
import {RestServicesModule} from "./rest-services/rest-services.module";



/*
 * @description: Core module should contain the most vital and low level parts of application
 */

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
