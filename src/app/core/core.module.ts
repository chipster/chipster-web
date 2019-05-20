import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AuthenticationModule } from "./authentication/authentication.module";
import { RestErrorService } from "./errorhandler/rest-error.service";



/*
 * @description: Core module should contain the most vital and low level parts of application
 */

@NgModule({
  imports: [
    CommonModule,
    AuthenticationModule
  ],
  declarations: [],
  providers: [RestErrorService]
})
export class CoreModule { }
