import {NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import {AuthenticationModule} from "./authentication/authentication.module";
import {RestErrorService} from "./errorhandler/rest-error.service";
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
  providers: [RestErrorService]
})
export class CoreModule { }
